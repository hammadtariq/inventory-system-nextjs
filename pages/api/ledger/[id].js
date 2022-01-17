import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const getTransactions = async (req, res) => {
  console.log("get transaction Request Start");

  try {
    await db.dbConnect();
    const { id, type = "company" } = req.query;
    const condtion = type === "company" ? { companyId: id } : { customerId: id };
    const transactions = await db.Ledger.findAll({
      where: condtion,
      order: [["updatedAt", "DESC"]],
      include: [
        {
          model: db.Company,
          as: "company",
        },
        {
          model: db.Customer,
          as: "customer",
        },
      ],
    });

    const rawQuery =
      type === "company"
        ? `SELECT SUM(
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
  GROUP BY "companies"."id"`
        : `SELECT SUM(
    CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
        amount
    WHEN "ledgers"."spendType" = 'DEBIT' THEN
        - amount
    ELSE
        0
    END) AS amount
FROM ledgers
INNER JOIN customers ON "ledgers"."customerId" = customers.id
WHERE "ledgers"."customerId" = ${id}
GROUP BY "customers"."id"`;

    const totalBalance = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });
    console.log("get transaction Request End");

    return res.send({
      transactions,
      totalBalance: totalBalance[0].amount,
    });
  } catch (error) {
    console.log("get transaction Request Error:", error);
    res.send(error);
  }
};

export default nextConnect().use(auth).get(getTransactions);
