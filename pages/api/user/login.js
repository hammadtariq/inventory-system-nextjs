import Joi from "joi";
import Iron from "@hapi/iron";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { compareHash } from "@/lib/bcrypt";
import { setTokenCookie, MAX_AGE } from "@/lib/auth-cookies";

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const apiSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().min(8).trim().required(),
});

const login = async (req, res) => {
  console.log("Login Request Start");

  const { error, value } = apiSchema.validate({ ...req.body });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
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

    const tokenWithouPassword = {
      user: {
        id: user.id,
        uuid: user.uuid,
        fisrtName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      },
      token: {
        maxAge: new Date(Date.now() + MAX_AGE * 1000),
      },
    };

    const sealedToken = await Iron.seal(tokenWithouPassword, TOKEN_SECRET, Iron.defaults);

    setTokenCookie(res, sealedToken);
    console.log("Login Request End");

    return res.send({
      token: sealedToken,
      user: {
        uuid: user.uuid,
        fisrtName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Login Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().post(login);
