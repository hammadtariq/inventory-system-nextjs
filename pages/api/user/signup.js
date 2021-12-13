import db from "@/lib/postgres";
import Joi from "joi";
import { apiHandler } from "@/lib/handler";

const apiSchema = Joi.object({
  firstName: Joi.string().min(3).trim().required(),
  lastName: Joi.string().min(3).trim().required(),
  email: Joi.string().email().trim().required(),
  role: Joi.string().trim().required().valid("EDITOR"),
  password: Joi.string().min(8).trim().required(),
});

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

    await db.User.create({
      ...value,
    });

    return res.send({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).send(error);
  }
};

export default apiHandler.post(signup);
