import Joi from "joi";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { createLedgerPayment } from "@/lib/ledger";
import TenantContext from "@/lib/tenant-context";

const apiSchema = Joi.object({
  companyId: Joi.number(),
  totalAmount: Joi.number().required(),
  spendType: Joi.string().trim().required(),
  customerId: Joi.number(),
  paymentType: Joi.string().trim().required(),
  paymentDate: Joi.string().trim().required(),
  otherName: Joi.string().trim().optional().allow(""),
  chequeId: Joi.string().trim(),
  dueDate: Joi.string().trim(),
  reference: Joi.string().trim(),
});

const createPayment = async (req, res) => {
  console.log("create transaction Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const {
      totalAmount,
      reference,
      companyId,
      spendType,
      customerId,
      paymentType,
      paymentDate,
      otherName = "",
      chequeId,
      dueDate,
    } = value;

    if (companyId) {
      const company = await db.Company.findOne({ where: { id: companyId, organizationId } });
      if (!company) return res.status(404).send({ message: "company not found" });
    }

    if (customerId) {
      const customer = await db.Customer.findOne({ where: { id: customerId, organizationId } });
      if (!customer) return res.status(404).send({ message: "customer not found" });
    }

    if (chequeId && dueDate) {
      await db.Cheque.create({
        chequeId,
        dueDate,
        status: "PENDING",
        organizationId,
      });
    }

    const data = await createLedgerPayment({
      companyId,
      totalAmount,
      spendType,
      customerId,
      paymentType,
      paymentDate,
      otherName,
      reference,
    });
    console.log("create transaction Request End");

    res.send(data);
  } catch (error) {
    console.log("create transaction Request Error:", error);
    res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).post(createPayment);
