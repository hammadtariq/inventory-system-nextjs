import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { saleGraphQuery } from "@/query/index";

const graphSaleTable = async (req, res) => {
  try {
    await db.dbConnect();
    const yearlyData = await db.sequelize.query(saleGraphQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    return res.send(yearlyData);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
};

export default nextConnect().use(auth).get(graphSaleTable);
