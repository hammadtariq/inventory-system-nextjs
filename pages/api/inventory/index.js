import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";

const getAllInventory = async (req, res) => {
  console.log("Get all inventory Request Start");

  const { limit, offset, attributes = [], filters } = req.query;
  const options = {};
  options.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  options.offset = offset ? offset : 0;
  if (attributes.length) {
    options.attributes = JSON.parse(attributes);
  }

  const filterObj = filters ? JSON.parse(filters) : {};
  const { companyIds = [], itemId } = filterObj;
  const filterExists = companyIds.length > 0 || itemId;
  if (filterExists && options.offset) {
    options.offset = 0;
  }

  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll({
      ...options,
      where: {
        onHand: { [db.Sequelize.Op.gt]: 0 },
        ...(companyIds.length > 0 && {
          companyId: { [db.Sequelize.Op.in]: companyIds },
        }),
        ...(itemId && { id: { [db.Sequelize.Op.eq]: `${itemId}` } }),
      },
      include: [db.Company],
      order: [["itemName", "ASC"]],
    });
    console.log("Get all inventory Request End");
    return res.send(data);
  } catch (error) {
    console.log("Get all inventory Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).get(getAllInventory);
