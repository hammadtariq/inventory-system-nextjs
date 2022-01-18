import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { companyQuery, customerQuery } from "../../../query";

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
    return res.status(400).send({ message: error.toString() });
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
    return res.status(500).send({ message: error.toString() });
  }
};

const getAllTransactions = async (req, res) => {
  console.log("get all transaction Request Start");

  try {
    await db.dbConnect();

    const { type = "company" } = req.query;

    const rawQuery = type === "company" ? companyQuery : customerQuery;

    const transactions = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
    });

    const totalBalance = transactions.reduce((acc, obj) => acc + obj.total, 0);
    console.log("get all transaction Request End");
    return res.send({ transactions, totalBalance });
  } catch (error) {
    console.log("get all transaction Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getAllTransactions).post(createTransaction);
