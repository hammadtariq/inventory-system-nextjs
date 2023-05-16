import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";

const getAllInventory = async (req, res) => {
  console.log("Get all inventory Request Start");

  const { limit, offset, attributes = [] } = req.query;
  const options = {};
  options.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  options.offset = offset ? offset : 0;
  if (attributes.length) {
    options.attributes = JSON.parse(attributes);
  }
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAll({
      ...options,
      order: [["id", "ASC"]],
    });
    const data2 = await db.Items.findAll({
      ...options,
      order: [["id", "ASC"]],
    });
    console.log("Get all inventory Request End");

    let inventory;
    let items;
    let itemNotFound = [];
    for (let i = 0; i < data2.length; i++) {
      const element = data2[i];
      items = element.dataValues;

      for (let j = 0; j < data.length; j++) {
        const element = data[j];
        inventory = element.dataValues;
        if (items.id === inventory.id && items.companyId === inventory.companyId) {
          if (items.itemName != inventory.itemName) {
            itemNotFound.push(items);
          }
        }
      }
    }

    return res.send({ data, data2 });
  } catch (error) {
    console.log("Get all inventory Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().get(getAllInventory);
