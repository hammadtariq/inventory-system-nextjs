import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";
import { seal } from "@/lib/hapiIron";
import { setTokenCookie, MAX_AGE } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;
console.log("TOKEN_SECRET: ", TOKEN_SECRET);

const apiSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().min(8).trim().required(),
});

const login = async (req, res) => {
  // validate api fields
  const { error, value } = apiSchema.validate({ ...req.body });
  console.log("value: ", value);

  // if api fields errors
  if (error && Object.keys(error).length) {
    return res.status(400).send({ error });
  }

  try {
    await db.dbConnect();

    const user = await db.User.findOne({ where: { email: value.email } });

    if (!user) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const isMatchPassword = await compareHash(value.password, user.password);

    if (!isMatchPassword) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const userWithoutPassword = {
      id: user.id,
      uuod: user.uuid,
      fisrtName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.createdAt,
      maxAge: new Date(Date.now() + MAX_AGE * 1000),
    };

    const token = await seal(userWithoutPassword, TOKEN_SECRET);
    setTokenCookie(res, token);

    return res.send({ token });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

export default nextConnect().post(login);
