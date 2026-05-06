import Joi from "joi";
import nextConnect from "next-connect";
import { UniqueConstraintError } from "sequelize";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import { buildInviteUrl, createInviteToken, getInviteExpiry, hashInviteToken } from "@/lib/org-onboarding";
import { sendInviteEmail } from "@/lib/invite-email";

const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim().lowercase().required(),
  lastName: Joi.string().min(3).trim().lowercase().required(),
  email: Joi.string().email().trim().lowercase().required(),
  role: Joi.string().valid("ADMIN", "EDITOR").default("EDITOR"),
});

export const inviteUser = async (req, res) => {
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    return res.status(403).send({ message: "Operation not permitted." });
  }

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const userCount = await db.User.count({ where: { organizationId } });
    if (userCount >= req.organization.maxUsers) {
      return res.status(400).send({ message: "Organization user limit reached." });
    }

    const existingUser = await db.User.findOne({
      where: { email: value.email },
      tenantBypass: true,
    });
    if (existingUser) {
      return res.status(409).send({ message: "A user with this email already exists." });
    }

    const inviteToken = createInviteToken();
    const inviteTokenHash = hashInviteToken(inviteToken);
    const inviteExpiresAt = getInviteExpiry();

    const invitedUser = await db.User.create(
      {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: createInviteToken(),
        role: value.role,
        status: "INVITED",
        organizationId,
        inviteTokenHash,
        inviteExpiresAt,
        invitedAt: new Date(),
      },
      { tenantBypass: true }
    );

    const inviteUrl = buildInviteUrl(req, inviteToken);
    let emailStatus = "NOT_CONFIGURED";
    try {
      const emailSent = await sendInviteEmail({
        to: invitedUser.email,
        inviteUrl,
        organizationName: req.organization?.name || "Inventory System",
        firstName: invitedUser.firstName,
      });
      emailStatus = emailSent ? "SENT" : "NOT_CONFIGURED";
    } catch (emailError) {
      console.error("Invite email failed:", emailError);
      emailStatus = "FAILED";
    }

    return res.status(201).send({
      success: true,
      inviteUrl,
      emailStatus,
      user: {
        id: invitedUser.id,
        uuid: invitedUser.uuid,
        firstName: invitedUser.firstName,
        lastName: invitedUser.lastName,
        email: invitedUser.email,
        role: invitedUser.role,
        status: invitedUser.status,
        inviteExpiresAt: invitedUser.inviteExpiresAt,
      },
    });
  } catch (error) {
    console.error("Invite user failed:", error);
    if (error instanceof UniqueConstraintError || error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({ message: "A user with this email already exists." });
    }

    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).post(inviteUser);
