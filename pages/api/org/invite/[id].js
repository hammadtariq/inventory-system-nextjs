import Joi from "joi";
import nextConnect from "next-connect";
import { UniqueConstraintError } from "sequelize";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { requireRole, onError } from "@/lib/authz";
import TenantContext from "@/lib/tenant-context";
import { buildInviteUrl, createInviteToken, getInviteExpiry, hashInviteToken } from "@/lib/org-onboarding";
import { sendInviteEmail } from "@/lib/invite-email";

const apiSchema = Joi.object({
  id: Joi.number().required(),
  sendEmail: Joi.boolean().default(true),
});

export const resendInvite = async (req, res) => {
  requireRole("ADMIN", "SUPER_ADMIN")(req.user);
  const { error, value } = apiSchema.validate({ id: req.query.id, sendEmail: req.body?.sendEmail });
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const user = await db.User.findOne({
      where: { id: value.id, organizationId },
      tenantBypass: true,
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.status !== "INVITED") {
      return res.status(400).send({ message: "Invite can only be generated for invited users." });
    }

    const inviteToken = createInviteToken();
    const inviteUrl = buildInviteUrl(req, inviteToken);
    await user.update(
      {
        inviteTokenHash: hashInviteToken(inviteToken),
        inviteExpiresAt: getInviteExpiry(),
        invitedAt: new Date(),
      },
      { tenantBypass: true }
    );

    let emailStatus = "SKIPPED";
    if (value.sendEmail) {
      try {
        const emailSent = await sendInviteEmail({
          to: user.email,
          inviteUrl,
          organizationName: req.organization?.name || "Inventory System",
          firstName: user.firstName,
        });
        emailStatus = emailSent ? "SENT" : "NOT_CONFIGURED";
      } catch (emailError) {
        console.error("Invite resend email failed:", emailError);
        emailStatus = "FAILED";
      }
    }

    return res.status(200).send({
      success: true,
      inviteUrl,
      emailStatus,
      user: {
        id: user.id,
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        inviteExpiresAt: user.inviteExpiresAt,
      },
    });
  } catch (error) {
    console.error("Resend invite failed:", error);
    if (error instanceof UniqueConstraintError || error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({ message: "A user with this email already exists." });
    }
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect({ onError }).use(auth).post(resendInvite);
