import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const ORGANIZATION_DELETE_MODELS = [
  "SaleReturn",
  "PurchaseHistory",
  "Ledger",
  "Cheque",
  "Sale",
  "Purchase",
  "Inventory",
  "Items",
  "Customer",
  "Company",
  "User",
];

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

    const users = await db.User.findAll({
      where: { organizationId: organization.id },
      attributes: ["id", "firstName", "lastName", "email", "role", "status", "organizationId"],
      order: [
        ["role", "ASC"],
        ["email", "ASC"],
      ],
      tenantBypass: true,
    });
    const organizationData = typeof organization.get === "function" ? organization.get({ plain: true }) : organization;
    const usersData = users.map((user) => (typeof user.get === "function" ? user.get({ plain: true }) : user));
    const primaryUser = usersData.find((user) => user.role === "ADMIN") || usersData[0] || null;

    return res.send({
      ...organizationData,
      email: primaryUser?.email || null,
      usersCount: usersData.length,
      users: usersData,
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export const deleteOrganization = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const organizationId = Number(req.query.id);
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    return res.status(400).send({ message: "Invalid organization id" });
  }

  if (organizationId === req.user.organizationId) {
    return res.status(400).send({ message: "Cannot delete your login organization." });
  }

  let transaction = null;

  try {
    await db.dbConnect();
    const organization = await db.Organization.findByPk(organizationId, { tenantBypass: true });

    if (!organization) {
      return res.status(404).send({ message: "Organization does not exist" });
    }

    transaction = await db.sequelize.transaction();
    await db.sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
      transaction,
      replacements: { organizationId },
    });

    for (const modelName of ORGANIZATION_DELETE_MODELS) {
      await db[modelName].destroy({
        where: { organizationId },
        transaction,
        tenantBypass: true,
      });
    }

    await organization.destroy({ transaction, tenantBypass: true });
    await transaction.commit();

    return res.send({ success: true });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Delete organization error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getOrganization).put(updateOrganization).delete(deleteOrganization);
