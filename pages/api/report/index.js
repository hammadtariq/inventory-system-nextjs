import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT } from "@/utils/api.util";
import sequelize from "sequelize";

const getPurchaseReport = async (req, res) => {
  console.log("Get all Purchase order Request Start");
  const { companyId } = req.query;
  try {
    await db.dbConnect();
    let data = await db.Purchase.findAll({
      where: {
        companyId: companyId,
      },
      include: [
        {
          model: db.Company,
          attributes: ["companyName"],

          required: true,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });
    console.log("Get all Purchase order Request End", typeof data);

    const products = [...new Set(data.map((item) => item.purchasedProducts[0].itemName))];

    return res.json({ data, products });
  } catch (error) {
    console.log("Get all Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).get(getPurchaseReport);
