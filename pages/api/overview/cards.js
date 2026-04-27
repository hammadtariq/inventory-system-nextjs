import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { customerQuery, companyQuery } from "@/query/index";

const getCards = async (req, res) => {
  try {
    await db.dbConnect();

    const [totalSalesResult, totalPurchasesResult, customerBalances, companyBalances] = await Promise.all([
      db.sequelize.query(`SELECT COALESCE(SUM("totalAmount"), 0) as total FROM sales WHERE status = 'APPROVED'`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(`SELECT COALESCE(SUM("totalAmount"), 0) as total FROM purchases WHERE status = 'APPROVED'`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(`SELECT COALESCE(SUM(t.total), 0) as total FROM (${customerQuery}) t WHERE t.total > 0`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(`SELECT COALESCE(SUM(t.total), 0) as total FROM (${companyQuery}) t WHERE t.total < 0`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
    ]);

    return res.send({
      totalSales: parseFloat(totalSalesResult[0].total) || 0,
      totalPurchases: parseFloat(totalPurchasesResult[0].total) || 0,
      totalSaleDue: parseFloat(customerBalances[0].total) || 0,
      totalPurchaseDue: parseFloat(companyBalances[0].total) || 0,
    });
  } catch (error) {
    console.error("Error retrieving dashboard cards:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getCards);
