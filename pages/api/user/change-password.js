import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { compareHash } from "@/lib/bcrypt";

const apiSchema = Joi.object({
  id: Joi.number().required(),
  oldPassword: Joi.string().min(8).trim().required(),
  newPassword: Joi.string().min(8).trim().required(),
});

const changePassword = async (req, res) => {
  console.log("change password Request Start");

  // validate api fields
  const { error, value } = apiSchema.validate({ ...req.body });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findByPk(value.id);

    // if user not found
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isMatchPassword = await compareHash(value.oldPassword, user.password);

    if (!isMatchPassword) {
      return res.status(401).send({ message: "Password could not be verified" });
    }

    await user.update({ password: value.newPassword });
    console.log("change password Request End");

    return res.send({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("change password Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).post(changePassword);
