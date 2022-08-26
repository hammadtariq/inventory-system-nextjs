import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";

const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim().required(),
  lastName: Joi.string().min(3).trim().required(),
  email: Joi.string().email().trim().required(),
  role: Joi.string().trim().required().valid("EDITOR"),
  password: Joi.string().min(8).trim().required(),
});

const signup = async (req, res) => {
  console.log("Sign up Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findOne({ where: { email: value.email } });

    // if user already exist
    if (user) {
      return res.status(409).send({ message: "User already exist" });
    }

    await db.User.create({
      ...value,
    });
    console.log("Sign up Request End");

    return res.send({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log("Sign up Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().post(signup);
