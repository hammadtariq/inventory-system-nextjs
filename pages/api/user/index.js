import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getAllUsers = async (req, res) => {
  console.log("get all users Request Start");
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const users = await db.User.findAndCountAll({
      ...pagination,
      attributes: { exclude: ["password"] },
      order: [["updatedAt", "DESC"]],
    });

    if (!users.length) {
      return res.send({ message: "No user found" });
    }
    console.log("get all users Request End");

    return res.send(users);
  } catch (error) {
    console.log("get all users Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getAllUsers);
