import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  companyId: Joi.number(),
  totalAmount: Joi.number().required(),
  spendType: Joi.string().trim().required(),
  customerId: Joi.number(),
  paymentType: Joi.string().trim().required(),
  paymentDate: Joi.string().trim().required(),
  otherName: Joi.string().trim(),
});

const createPayment = async (req, res) => {
  console.log("create transaction Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const { totalAmount, companyId, spendType, customerId, paymentType, paymentDate, otherName } = value;
    const data = await db.Ledger.create({
      companyId,
      amount: totalAmount,
      spendType,
      customerId,
      paymentType,
      paymentDate,
      otherName,
    });
    console.log("create transaction Request End");

    res.send(data);
  } catch (error) {
    console.log("create transaction Request Error:", error);
    return res.status(500).send({ message: error });
  }
};

export default nextConnect().use(auth).post(createPayment);
