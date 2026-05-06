import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim(),
  status: Joi.string().valid("ACTIVE", "SUSPENDED", "CANCELLED"),
  plan: Joi.string().valid("STARTER", "PRO", "ENTERPRISE"),
  maxUsers: Joi.number().integer().min(1),
});

const requireSuperAdmin = (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).send({ message: "Operation not permitted." });
    return false;
  }
  return true;
};

export const updateOrganization = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organization = await db.Organization.findByPk(req.query.id, { tenantBypass: true });

    if (!organization) {
      return res.status(404).send({ message: "Organization does not exist" });
    }

    await organization.update(value, { tenantBypass: true });

    return res.send({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export const getOrganization = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  try {
    await db.dbConnect();
    const organization = await db.Organization.findByPk(req.query.id, { tenantBypass: true });

    if (!organization) {
      return res.status(404).send({ message: "Organization does not exist" });
    }

    return res.send(organization);
  } catch (error) {
    console.error("Get organization error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getOrganization).put(updateOrganization);
