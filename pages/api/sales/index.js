import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { DEFAULT_ROWS_LIMIT, STATUS } from "@/utils/api.util";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase().required(),
  noOfBales: Joi.number().required(),
  baleWeightLbs: Joi.number(),
  baleWeightKgs: Joi.number(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
  ratePerBale: Joi.number(),
  companyId: Joi.number().required(),
  id: Joi.number().required(),
});
const apiSchema = Joi.object({
  customerId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  laborCharge: Joi.number().allow(null),
  soldDate: Joi.date().required(),
  soldProducts: Joi.array().items(inventorySchema).required(),
});

export const createSale = async (req, res) => {
  console.log("Create sale order Request Start");
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    await db.Sale.create({ ...value, status: STATUS.PENDING });
    console.log("Create sale order Request End");
    return res.send();
  } catch (error) {
    console.log("Create sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

const getAllSales = async (req, res) => {
  console.log("Get all sale order Request Start");

  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : DEFAULT_ROWS_LIMIT;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const sales = await db.Sale.findAndCountAll({
      ...pagination,
      include: [db.Customer],
      order: [["updatedAt", "DESC"]],
    });
    console.log("Get all sale order Request End");

    return res.send(sales);
  } catch (error) {
    console.log("Get all sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).post(createSale).get(getAllSales);
