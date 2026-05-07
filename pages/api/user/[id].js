import Joi from "joi";
import nextConnect from "next-connect";
import { UniqueConstraintError } from "sequelize";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

// api schema for all routes for this file only
const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim(),
  lastName: Joi.string().min(3).trim(),
  email: Joi.string().email().trim(),
  role: Joi.string().valid("ADMIN", "EDITOR", "SUPER_ADMIN"),
  status: Joi.string().valid("ACTIVE", "INVITED", "DISABLED"),
  id: Joi.number().required(),
});

export const getUser = async (req, res) => {
  console.log("Get user Request Start");
  // validate api fields
  const { error, value } = apiSchema.validate({ id: req.query.id });

  //   if api fields errors
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    // if user id and api fields are valid then connect database
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const user = await db.User.findOne({
      where: { id: value.id, organizationId },
      attributes: { exclude: ["password"] },
    });

    // if user not found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    console.log("Get user Request End");

    return res.send({ success: true, user });
  } catch (error) {
    console.log("Get user Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export const updateUser = async (req, res) => {
  // validate api fields
  console.log("update user Request Start");

  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  //   if api fields errors
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    // if user id and api fields are valid then connect database
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const user = await db.User.findOne({
      where: { id: value.id, organizationId },
      attributes: { exclude: ["password"] },
    });

    // if user not found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // if req.body is empty
    if (!Object.keys(req.body).length) {
      return res.status(400).send({
        message: "Please provide at least one field",
        allowedFields: ["firstName", "lastName", "email", "role", "status"],
      });
    }

    if (value.email && value.email !== user.email) {
      const existingUser = await db.User.findOne({
        where: { email: value.email },
        tenantBypass: true,
      });

      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).send({ message: "A user with this email already exists." });
      }
    }

    // update user
    await user.update({ ...value });
    console.log("update user Request End");

    return res.send({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.log("update user Request Error:", error);
    if (error instanceof UniqueConstraintError || error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({ message: "A user with this email already exists." });
    }
    return res.status(500).send({ success: false, error });
  }
};

export const deleteUser = async (req, res) => {
  console.log("delete user Request Start");
  // validate api fields
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const user = await db.User.findOne({ where: { id: value.id, organizationId } });

    // if user not found
    if (!user) {
      return res.status(404).send({ message: "User does not exist" });
    }

    // delete user
    await db.User.destroy({ where: { id: value.id, organizationId } });
    console.log("delete user Request End");

    return res.send({
      message: "User deleted succesfully",
    });
  } catch (error) {
    console.log("delete user Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getUser).put(updateUser).delete(deleteUser);
