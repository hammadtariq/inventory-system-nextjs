import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  companyId: Joi.number(),
  totalAmount: Joi.number().required(),
  spendType: Joi.string().trim().required(),
  customerId: Joi.number(),
});

const createTransaction = async (req, res) => {
  console.log("create transaction Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const { totalAmount, companyId, spendType, customerId } = value;
    const data = await db.Ledger.create({
      companyId,
      amount: totalAmount,
      spendType,
      customerId,
    });
    console.log("create transaction Request End");

    res.send(data);
  } catch (error) {
    console.log("create transaction Request Error:", error);
    return res.status(500).send({ message: error });
  }
};

const getAllTransactions = async (req, res) => {
  console.log("get all transaction Request Start");

  try {
    await db.dbConnect();

    const { type = "company" } = req.query;

    const rawQuery =
      type === "company"
        ? `SELECT "companies"."companyName" as name,
    "companies"."createdAt" as "createdAt",
    "companies"."id" as "id",
    SUM(
        CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
            amount
        WHEN "ledgers"."spendType" = 'DEBIT' THEN
            - amount
        ELSE
            0
        END) AS total
    FROM ledgers
    INNER JOIN companies ON "ledgers"."companyId" = companies.id
    GROUP BY "companies"."id"`
        : `SELECT CONCAT(c."firstName", ' ', c."lastName") as name,
    c."id" as "id",
    SUM(
        CASE WHEN "ledgers"."spendType" = 'CREDIT' THEN
            amount
        WHEN "ledgers"."spendType" = 'DEBIT' THEN
            - amount
        ELSE
            0
        END) AS total
    FROM ledgers
    INNER JOIN customers c ON "ledgers"."customerId" = c.id
    GROUP BY c."id"`;

    const transactions = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });

    // // const balance = transactions.reduce((a, b) => ({ totalBalance: a.total + b.total }));
    let totalBalance = 0;
    transactions.map((item) => (totalBalance += item.total));
    console.log("get all transaction Request End");
    return res.send({ transactions, totalBalance });
  } catch (error) {
    console.log("get all transaction Request Error:", error);
    res.send(error);
  }
};

export default nextConnect().use(auth).get(getAllTransactions).post(createTransaction);
