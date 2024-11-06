import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
const Op = db.Sequelize.Op;

const searchItems = async (req, res) => {
  const { value } = req.query;
  try {
    await db.dbConnect();
    const results = await db.Items.findAll({
      where: {
        [Op.or]: [{ itemName: { [Op.like]: "%" + value + "%" } }],
      },
      include: [db.Company],
    });
    return res.send(results);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(searchItems);
