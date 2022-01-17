import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id } = req.query;
    const transactions = await db.Ledger.findAll({
      where: { companyId: id },
      include: {
        model: db.Company,
        as: "company",
      },
    });

    const totalBalance = await db.sequelize.query(
      `SELECT SUM(
              CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
                  amount
              WHEN "ledgers"."spendType" = 'DEBIT' THEN
                  - amount
              ELSE
                  0
              END) AS amount
          FROM ledgers
          INNER JOIN companies ON "ledgers"."companyId" = companies.id
          WHERE "ledgers"."companyId" = ${id}
          GROUP BY "companies"."companyName"`,
      {
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );
    console.log("get transaction Request End");

    return res.send({
      transactions,
      totalBalance: totalBalance[0].amount,
    });
  } catch (error) {
    console.log("get transaction Request Error:", error);
    res.send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getTransactions);
