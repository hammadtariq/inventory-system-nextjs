import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
const Op = db.Sequelize.Op;

const searchInventory = async (req, res) => {
  const { value } = req.query;
  try {
    await db.dbConnect();
    const results = await db.Inventory.findAll({
      where: {
        [Op.or]: [{ itemName: { [Op.like]: "%" + value + "%" } }],
      },
    });
    return res.send(results);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(searchInventory);
