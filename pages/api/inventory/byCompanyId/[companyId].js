import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getInventoryNameByCompanyId = async (req, res) => {
  const { limit, offset, companyId } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll({
      ...pagination,
      where: { companyId },
      attributes: ["itemName", "id"],
    });

    return res.send(data);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getInventoryNameByCompanyId);
