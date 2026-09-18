import Joi from "joi";
import nextConnect from "next-connect";
import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { createLedgerPayment } from "@/lib/ledger";
import TenantContext from "@/lib/tenant-context";

const ROLE_TYPES = ["company", "customer"];
const OTHER_SENTINEL = -1;

const apiSchema = Joi.object({
  companyId: Joi.number(),
  customerId: Joi.number(),
  payToType: Joi.string()
    .trim()
    .valid(...ROLE_TYPES),
  payToId: Joi.number().integer().positive().allow(OTHER_SENTINEL),
  payByType: Joi.string()
    .trim()
    .valid(...ROLE_TYPES),
  payById: Joi.number().integer().positive().allow(OTHER_SENTINEL),
  totalAmount: Joi.number().greater(0).required(),
  spendType: Joi.string().trim().required(),
  paymentType: Joi.string().trim().required(),
  paymentDate: Joi.string().trim().required(),
  otherName: Joi.string().trim().optional().allow(""),
  chequeId: Joi.string().trim().when("paymentType", { is: "CHEQUE", then: Joi.required(), otherwise: Joi.optional() }),
  dueDate: Joi.string().trim().when("paymentType", { is: "CHEQUE", then: Joi.required(), otherwise: Joi.optional() }),
  reference: Joi.string().trim().allow(""),
})
  .and("payToType", "payToId", "payByType", "payById")
  .custom((value, helpers) => {
    const { payToType, payToId, payByType, payById } = value;

    // Legacy payload (no role fields) — nothing further to check here.
    if (payToType === undefined) return value;

    const isDefaultCombo = payToType === "company" && payByType === "customer";
    const payToIsOther = payToId === OTHER_SENTINEL;
    const payByIsOther = payById === OTHER_SENTINEL;

    if ((payToIsOther || payByIsOther) && !isDefaultCombo) {
      return helpers.message("Other party is only supported for Pay To Company / Pay By Customer");
    }

    if (payToIsOther && payByIsOther) {
      return helpers.message("Pay To and Pay By cannot both be Other");
    }

    if (payToType === payByType && payToId === payById) {
      return helpers.message("Pay To and Pay By cannot be the same party");
    }

    return value;
  });

const mapRolePayloadToLedgerColumns = ({ payToType, payToId, payByType, payById }) => ({
  payToCompanyId: payToType === "company" && payToId !== OTHER_SENTINEL ? payToId : null,
  payToCustomerId: payToType === "customer" && payToId !== OTHER_SENTINEL ? payToId : null,
  payByCompanyId: payByType === "company" && payById !== OTHER_SENTINEL ? payById : null,
  payByCustomerId: payByType === "customer" && payById !== OTHER_SENTINEL ? payById : null,
});

const verifyParty = async (type, id, organizationId) => {
  if (id === undefined || id === null || id === OTHER_SENTINEL) return true;

  const record =
    type === "company"
      ? await db.Company.findOne({ where: { id, organizationId } })
      : await db.Customer.findOne({ where: { id, organizationId } });

  return Boolean(record);
};

export const createPayment = async (req, res) => {
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
      payToType,
      payToId,
      payByType,
      payById,
    } = value;

    const isRolePayload = payToType !== undefined;

    if (isRolePayload) {
      const [payToOk, payByOk] = await Promise.all([
        verifyParty(payToType, payToId, organizationId),
        verifyParty(payByType, payById, organizationId),
      ]);

      if (!payToOk) return res.status(404).send({ message: `${payToType} not found` });
      if (!payByOk) return res.status(404).send({ message: `${payByType} not found` });
    } else {
      if (companyId) {
        const company = await db.Company.findOne({ where: { id: companyId, organizationId } });
        if (!company) return res.status(404).send({ message: "company not found" });
      }

      if (customerId) {
        const customer = await db.Customer.findOne({ where: { id: customerId, organizationId } });
        if (!customer) return res.status(404).send({ message: "customer not found" });
      }
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
      ...(isRolePayload ? mapRolePayloadToLedgerColumns(value) : { companyId, customerId }),
      totalAmount,
      spendType,
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
