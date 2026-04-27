import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { customerQuery } from "@/query/index";

const getSalesDistribution = async (req, res) => {
  try {
    await db.dbConnect();

    const [paidResult, dueResult, returnResult] = await Promise.all([
      db.sequelize.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM ledgers
         WHERE "customerId" IS NOT NULL
           AND "paymentType" IN ('CASH', 'ONLINE', 'CHEQUE')`,
        { type: db.Sequelize.QueryTypes.SELECT }
      ),
      db.sequelize.query(`SELECT COALESCE(SUM(t.total), 0) as total FROM (${customerQuery}) t WHERE t.total > 0`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
      db.sequelize.query(`SELECT COALESCE(SUM("totalAmount"), 0) as total FROM "saleReturns"`, {
        type: db.Sequelize.QueryTypes.SELECT,
      }),
    ]);

    return res.send({
      paid: parseFloat(paidResult[0].total) || 0,
      due: parseFloat(dueResult[0].total) || 0,
      return: parseFloat(returnResult[0].total) || 0,
    });
  } catch (error) {
    console.error("Error retrieving sales distribution:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export default nextConnect().use(auth).get(getSalesDistribution);
