import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { purchaseGraphQuery } from "@/query/index";

const graphPurchaseTable = async (req, res) => {
  try {
    await db.dbConnect();
    const yearlyData = await db.sequelize.query(purchaseGraphQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    return res.send(yearlyData);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
};

export default nextConnect().use(auth).get(graphPurchaseTable);
