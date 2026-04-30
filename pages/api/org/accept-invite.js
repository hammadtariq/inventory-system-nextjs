import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { hashInviteToken, setLoginSession } from "@/lib/org-onboarding";

const apiSchema = Joi.object({
  token: Joi.string().min(32).required(),
  password: Joi.string().min(8).trim().required(),
});

export const acceptInvite = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const inviteTokenHash = hashInviteToken(value.token);

    const invitedUser = await db.User.findOne({
      where: { inviteTokenHash, status: "INVITED" },
      tenantBypass: true,
    });

    if (!invitedUser) {
      return res.status(404).send({ message: "Invite not found or already accepted." });
    }

    if (invitedUser.inviteExpiresAt && new Date(invitedUser.inviteExpiresAt) < new Date()) {
      return res.status(400).send({ message: "Invite has expired." });
    }

    const organization = await db.Organization.findByPk(invitedUser.organizationId, { tenantBypass: true });
    if (!organization) {
      return res.status(404).send({ message: "Organization not found." });
    }

    if (organization.status !== "ACTIVE") {
      return res.status(403).send({ message: "Organization suspended" });
    }

    await invitedUser.update(
      {
        password: value.password,
        status: "ACTIVE",
        inviteTokenHash: null,
        inviteExpiresAt: null,
        acceptedAt: new Date(),
      },
      { tenantBypass: true }
    );

    const token = await setLoginSession(res, { user: invitedUser, organization });

    return res.status(200).send({
      success: true,
      token,
      user: {
        uuid: invitedUser.uuid,
        fisrtName: invitedUser.firstName,
        lastName: invitedUser.lastName,
        email: invitedUser.email,
        role: invitedUser.role,
        organizationUuid: organization.uuid,
        organizationSlug: organization.slug,
      },
    });
  } catch (error) {
    console.error("Accept invite failed:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().post(acceptInvite);
