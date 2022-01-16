import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getAllInventory = async (req, res) => {
  console.log("Get all inventory Request Start");

  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll({
      ...pagination,
      include: [db.Company],
      order: [["updatedAt", "DESC"]],
    });

    console.log("Get all inventory Request End");
    return res.send(data);
  } catch (error) {
    console.log("Get all inventory Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).get(getAllInventory);
