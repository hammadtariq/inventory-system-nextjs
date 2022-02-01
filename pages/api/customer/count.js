import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const dbConnect = db.dbConnect;

const getCustomersCount = async (req, res) => {
  console.log("Get Customers Count Request Start");
  try {
    await dbConnect();
    const data = await db.Customer.findAll({
      attributes: [[db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"]],
    });

    console.log("Get Customers Count Request End");

    return res.send(data[0]);
  } catch (error) {
    console.log("Get Customers Count Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getCustomersCount);
