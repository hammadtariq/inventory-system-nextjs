import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";
import { setLoginSession } from "@/lib/org-onboarding";

const apiSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().min(8).trim().required(),
});

export const ensureUserOrganization = async (user) => {
  if (user.organizationId) {
    const organization = await db.Organization.findByPk(user.organizationId);
    return organization;
  }

  const [organization] = await db.Organization.findOrCreate({
    where: { slug: "default" },
    defaults: {
      name: "Default",
      plan: "STARTER",
      status: "ACTIVE",
      maxUsers: 5,
    },
    tenantBypass: true,
  });

  await user.update({ organizationId: organization.id }, { tenantBypass: true });
  user.organizationId = organization.id;

  return organization;
};

const login = async (req, res) => {
  console.log("Login Request Start");

  const { error, value } = apiSchema.validate({ ...req.body });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();

    const user = await db.User.findOne({
      where: { email: value.email },
      tenantBypass: true,
    });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.status === "INVITED") {
      return res.status(403).send({ message: "Please accept your invite before logging in." });
    }

    if (user.status === "DISABLED") {
      return res.status(403).send({ message: "User account disabled." });
    }

    const isMatchPassword = await compareHash(value.password, user.password);

    if (!isMatchPassword) {
      return res.status(401).send({ message: "Invalid password" });
    }

    const organization = await ensureUserOrganization(user);

    if (!organization) {
      return res.status(401).send({ message: "Organization not found" });
    }

    if (organization.status !== "ACTIVE") {
      return res.status(403).send({ message: "Organization suspended" });
    }

    const sealedToken = await setLoginSession(res, { user, organization });
    console.log("Login Request End");

    return res.send({
      token: sealedToken,
      user: {
        uuid: user.uuid,
        fisrtName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationUuid: organization.uuid,
        organizationSlug: organization.slug,
      },
    });
  } catch (error) {
    console.error("Login Request Error:", error?.message, error?.stack);
    res.status(500).send({ message: error?.message || "Internal server error" });
  }
};

export default nextConnect().post(login);
