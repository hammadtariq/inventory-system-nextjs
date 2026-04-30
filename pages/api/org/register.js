import Joi from "joi";
import nextConnect from "next-connect";
import { UniqueConstraintError } from "sequelize";

import db from "@/lib/postgres";
import { normalizeSlug, setLoginSession } from "@/lib/org-onboarding";

const apiSchema = Joi.object({
  organizationName: Joi.string().min(3).max(255).trim().required(),
  slug: Joi.string().min(3).max(64).trim(),
  firstName: Joi.string().min(3).trim().lowercase().required(),
  lastName: Joi.string().min(3).trim().lowercase().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).trim().required(),
});

export const registerOrg = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  const slug = normalizeSlug(value.slug || value.organizationName);
  if (slug.length < 3) {
    return res.status(400).send({ message: "Organization slug must be at least 3 characters." });
  }

  let transaction;
  try {
    await db.dbConnect();
    transaction = await db.sequelize.transaction();

    const existingOrg = await db.Organization.findOne({
      where: { slug },
      transaction,
      tenantBypass: true,
    });
    if (existingOrg) {
      await transaction.rollback();
      return res.status(409).send({ message: "Organization slug already exists." });
    }

    const existingUser = await db.User.findOne({
      where: { email: value.email },
      transaction,
      tenantBypass: true,
    });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).send({ message: "Email already exists." });
    }

    const organization = await db.Organization.create(
      {
        name: value.organizationName,
        slug,
        plan: "STARTER",
        status: "ACTIVE",
        maxUsers: 5,
      },
      { transaction, tenantBypass: true }
    );

    const user = await db.User.create(
      {
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        role: "ADMIN",
        status: "ACTIVE",
        organizationId: organization.id,
        acceptedAt: new Date(),
      },
      { transaction, tenantBypass: true }
    );

    await transaction.commit();

    const token = await setLoginSession(res, { user, organization });

    return res.status(201).send({
      success: true,
      token,
      user: {
        uuid: user.uuid,
        fisrtName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationUuid: organization.uuid,
        organizationSlug: organization.slug,
      },
      organization: {
        uuid: organization.uuid,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Register organization failed:", error);

    if (error instanceof UniqueConstraintError || error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors?.[0]?.path || Object.keys(error.fields || {})[0];
      const message =
        field === "slug"
          ? "Organization slug already exists."
          : field === "email"
          ? "Email already exists."
          : "Organization or user already exists.";

      return res.status(409).send({ message });
    }

    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().post(registerOrg);
