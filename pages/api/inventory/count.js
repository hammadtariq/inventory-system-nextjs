import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const dbConnect = db.dbConnect;

const getInventoryCount = async (req, res) => {
  console.log("Get Inventory Count Request Start");
  try {
    await dbConnect();
    const data = await db.Inventory.findAll({
      attributes: [[db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"]],
    });

    console.log("Get Inventory Count Request End");

    return res.send(data[0]);
  } catch (error) {
    console.log("Get Inventory Count Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getInventoryCount);
