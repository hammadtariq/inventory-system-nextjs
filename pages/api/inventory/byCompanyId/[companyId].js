import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getInventoryNameByCompanyId = async (req, res) => {
  console.log("getInventoryNameByCompanyId Request Start");

  const { limit, offset, companyId } = req.query;
  const pagination = {};

  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll({
      ...pagination,
      where: { onHand: { [db.Sequelize.Op.gt]: 0 }, companyId },
      attributes: ["itemName", "id"],
    });
    console.log("getInventoryNameByCompanyId Request End");
    return res.send(data);
  } catch (error) {
    console.log("getInventoryNameByCompanyId Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getInventoryNameByCompanyId);
