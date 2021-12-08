import db from "@/lib/postgres";
import nextConnect from "next-connect";
import Joi from "joi";

// api schema for all routes for this file only
const apiSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  id: Joi.number().required(),
});

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
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
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
    await user.update({ ...req.body });

    return res.send({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).send({ success: false, error });
  }
};

export default nextConnect().put(updateUser);
