import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT, STATUS } from "@/utils/api.util";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase().required(),
  noOfBales: Joi.number().required(),
  baleWeightLbs: Joi.number().allow(null),
  baleWeightKgs: Joi.number().allow(null),
  ratePerLbs: Joi.number().allow(null),
  ratePerKgs: Joi.number().allow(null),
  ratePerBale: Joi.number().allow(null),
  id: Joi.number().required(),
});
const apiSchema = Joi.object({
  companyId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  surCharge: Joi.number().allow(null),
  invoiceNumber: Joi.string().trim().allow(null),
  purchaseDate: Joi.date().required(),
  baleType: Joi.string().valid("SMALL_BALES", "BIG_BALES").required(),
  purchasedProducts: Joi.array().items(inventorySchema).required(),
});

const createPurchaseOrder = async (req, res) => {
  console.log("Create Purchase order Request Start");

  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    await db.Purchase.create({ ...value, status: STATUS.PENDING });
    console.log("Create Purchase order Request End");
    return res.send();
  } catch (error) {
    console.log("Create Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const getAllPurchase = async (req, res) => {
  console.log("Get all Purchase order Request Start");

  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Purchase.findAndCountAll({
      ...pagination,
      include: [db.Company],
      order: [["updatedAt", "DESC"]],
    });
    console.log("Get all Purchase order Request End");

    return res.send(data);
  } catch (error) {
    console.log("Get all Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).post(createPurchaseOrder).get(getAllPurchase);
