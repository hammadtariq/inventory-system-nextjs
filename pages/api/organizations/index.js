import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim().required(),
  slug: Joi.string().min(3).max(64).trim(),
  firstName: Joi.string().min(3).trim().lowercase(),
  lastName: Joi.string().min(3).trim().lowercase(),
  email: Joi.string().email().trim().lowercase(),
  password: Joi.string().min(8).trim(),
});

const requireSuperAdmin = (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    res.status(403).send({ message: "Operation not permitted." });
    return false;
  }
  return true;
};

export const getOrganizations = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  try {
    await db.dbConnect();
    const organizations = await db.Organization.findAll({
      order: [["createdAt", "DESC"]],
      tenantBypass: true,
    });
    const organizationIds = organizations.map((organization) => organization.id);
    const users = organizationIds.length
      ? await db.User.findAll({
          where: { organizationId: organizationIds },
          attributes: ["id", "firstName", "lastName", "email", "role", "status", "organizationId"],
          order: [
            ["role", "ASC"],
            ["email", "ASC"],
          ],
          tenantBypass: true,
        })
      : [];

    const usersByOrganizationId = users.reduce((acc, user) => {
      const userData = typeof user.get === "function" ? user.get({ plain: true }) : user;
      acc[userData.organizationId] = acc[userData.organizationId] || [];
      acc[userData.organizationId].push(userData);
      return acc;
    }, {});

    const rows = organizations.map((organization) => {
      const organizationData =
        typeof organization.get === "function" ? organization.get({ plain: true }) : organization;
      const organizationUsers = usersByOrganizationId[organizationData.id] || [];
      const primaryUser = organizationUsers.find((user) => user.role === "ADMIN") || organizationUsers[0] || null;

      return {
        ...organizationData,
        email: primaryUser?.email || null,
        usersCount: organizationUsers.length,
        users: organizationUsers,
      };
    });

    const query = String(req.query.q || "")
      .trim()
      .toLowerCase();
    const filteredRows = query
      ? rows.filter((organization) => {
          const searchableValues = [
            organization.name,
            organization.slug,
            organization.status,
            organization.plan,
            organization.email,
            ...(organization.users || []).map((user) => user.email),
          ];

          return searchableValues.some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );
        })
      : rows;

    return res.send({ count: filteredRows.length, rows: filteredRows });
  } catch (error) {
    console.error("Get organizations error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export const createOrganization = async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;

  const { error } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  return res.status(405).send({ message: "Use /api/org/register to create organizations." });
};

export default nextConnect().use(auth).get(getOrganizations).post(createOrganization);
