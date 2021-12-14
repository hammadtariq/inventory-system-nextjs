import db from "@/lib/postgres";
import Joi from "joi";
import { apiHandler } from "@/lib/handler";

// api schema for all routes for this file only
const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim(),
  lastName: Joi.string().min(3).trim(),
  email: Joi.string().email().trim(),
  id: Joi.number().required(),
});

const getUser = async (req, res) => {
  // validate api fields
  const { error, value } = apiSchema.validate({ id: req.query.id });

  //   if api fields errors
  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    // if user id and api fields are valid then connect database
    await db.dbConnect();
    const user = await db.User.findByPk(value.id, {
      attributes: { exclude: ["password"] },
    });

    // if user not found
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    return res.send({ success: true, user });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

const updateUser = async (req, res) => {
  // validate api fields
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  //   if api fields errors
  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    // if user id and api fields are valid then connect database
    await db.dbConnect();

    const user = await db.User.findByPk(value.id, {
      attributes: { exclude: ["password"] },
    });

    // if user not found
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    // if req.body is empty
    if (!Object.keys(req.body).length) {
      res.status(400).send({
        success: false,
        message: "Please provide at least one field",
        allowedFields: ["fisrtName", "lastName", "email"],
      });
    }

    // update user
    await user.update({ ...value });

    return res.send({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

const deleteUser = async (req, res) => {
  // validate api fields
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findByPk(value.id);

    // if user not found
    if (!user) {
      return res.status(404).send({ success: false, message: "User does not exist" });
    }

    // delete user
    await db.User.destroy({ where: { id: value.id } });

    return res.send({
      success: true,
      message: "User deleted succesfully",
    });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

export default apiHandler.get(getUser).put(updateUser).delete(deleteUser);
