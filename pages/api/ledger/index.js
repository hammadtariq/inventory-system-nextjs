import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  companyId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  spendType: Joi.string().trim().required(),
});

const createTransaction = async (req, res) => {
  console.log("create transaction Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const { user } = res;

    const { totalAmount, companyId, spendType } = value;
    const data = await db.Ledger.create({
      companyId,
      userId: user.id,
      amount: totalAmount,
      spendType,
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

    const transactions = await db.sequelize.query(
      `SELECT "companies"."companyName" as name,
      "companies"."createdAt" as "createdAt",
      "companies"."id" as "companyId",
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
      GROUP BY "companies"."id"`,
      {
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    const balance = transactions.reduce((a, b) => ({ totalBalance: a.total + b.total }));
    console.log("get all transaction Request End");
    return res.send({ transactions, ...balance });
  } catch (error) {
    console.log("get all transaction Request Error:", error);
    res.send(error);
  }
};

export default nextConnect().use(auth).get(getAllTransactions).post(createTransaction);
