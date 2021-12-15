import Joi from "joi";

import db from "@/lib/postgres";
import { apiHandler } from "@/lib/handler";
import { compareHash } from "@/lib/bcrypt";
import { seal } from "@/lib/hapiIron";
import { setTokenCookie } from "@/lib/auth-cookies";

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
      return res.status(404).send({ message: "User not found" });
    }

    const isMatchPassword = await compareHash(value.password, user.password);

    if (!isMatchPassword) {
      return res.status(401).send({ message: "Invalid password" });
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
    };

    const token = await seal(userWithoutPassword, TOKEN_SECRET);
    setTokenCookie(res, token);

    return res.send({ token });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

export default apiHandler.post(login);
