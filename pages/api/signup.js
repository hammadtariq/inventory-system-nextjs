import nextConnect from "next-connect";
import db from "@/lib/postgres";
import Joi from "joi";
import { createHash } from "@/lib/bcrypt";

const apiSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().required(),
  password: Joi.string().required(),
});

const onNoMatch = async (req, res) => {
  res.status(405).send({
    success: false,
    error: `Requested ${req.method} method not allowed`,
  });
};

const signup = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ success: false, error });
  }

  try {
    await db.dbConnect();
    const user = await db.User.findOne({ where: { email: value.email } });

    // if user already exist
    if (user) {
      return res
        .status(409)
        .send({ success: false, message: "User already exist" });
    }

    const hashPassword = await createHash(value.password);

    await db.User.create({
      ...value,
      password: hashPassword,
    });

    return res.send({
      succress: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.send(error);
  }
};

export default nextConnect({ onNoMatch }).post(signup);
