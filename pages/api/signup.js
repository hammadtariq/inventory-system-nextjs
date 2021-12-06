import nextConnect from "next-connect";
import db from "@/lib/dbConnect";
import { createHash } from "@/lib/bcrypt";

const dbConnect = db.dbConnect;

const onNoMatch = async (req, res) => {
  res.status(405).send({
    success: false,
    error: `Requested ${req.method} method not allowed`,
  });
};

const signup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).send({
      success: false,
      message: "Please provide all fields",
      required: ["firstName", "lastName", "email", "password", "role"],
    });
  }

  try {
    await dbConnect();
    const user = await db.User.findOne({ where: { email } });

    // if user already exist
    if (user) {
      return res
        .status(409)
        .send({ success: false, message: "User already exist" });
    }

    const hashPassword = await createHash(password);

    await db.User.create({
      firstName,
      lastName,
      email,
      role,
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
