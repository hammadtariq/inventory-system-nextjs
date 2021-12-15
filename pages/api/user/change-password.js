import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";

const apiSchema = Joi.object({
  id: Joi.number().required(),
  oldPassword: Joi.string().min(8).trim().required(),
  newPassword: Joi.string().min(8).trim().required(),
});

const changePassword = async (req, res) => {
  // validate api fields
  const { error, value } = apiSchema.validate({ ...req.body });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findByPk(value.id);

    // if user not found
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const isMatchPassword = await compareHash(value.oldPassword, user.password);

    if (!isMatchPassword) {
      return res.status(401).send({ success: false, message: "Password could not be verified" });
    }

    await user.update({ password: value.newPassword });

    return res.send({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).send({ success: false, message });
  }
};

export default nextConnect().post(changePassword);
