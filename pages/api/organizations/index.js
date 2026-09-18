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
    });

    return res.send({ count: organizations.length, rows: organizations });
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
