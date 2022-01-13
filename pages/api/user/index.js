import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getAllUsers = async (_, res) => {
  console.log("get all users Request Start");

  try {
    await db.dbConnect();
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["updatedAt", "DESC"]],
    });

    if (!users.length) {
      return res.send({ success: true, message: "No user found", users });
    }
    console.log("get all users Request End");

    return res.send({ success: true, users });
  } catch (error) {
    console.log("get all users Request Error:", error);
    return res.status(500).send({ success: false, error });
  }
};

export default nextConnect().use(auth).get(getAllUsers);
