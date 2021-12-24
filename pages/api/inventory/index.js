import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getAllInventory = async (req, res) => {
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll(pagination);

    return res.send(data);
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};
export default nextConnect().use(auth).get(getAllInventory);
