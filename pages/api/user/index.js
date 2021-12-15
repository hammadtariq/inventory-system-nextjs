import nextConnect from "next-connect";

import db from "@/lib/postgres";


const getAllUsers = async (_, res) => {
  try {
    await db.dbConnect();
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
    });

    if (!users.length) {
      return res.send({ success: true, message: "No user found", users });
    }

    return res.send({ success: true, users });
  } catch (error) {
    return res.status(500).send({ success: false, error });
  }
};

export default nextConnect().get(getAllUsers);
