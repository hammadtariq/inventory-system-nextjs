import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase().required(),
  noOfBales: Joi.number().required(),
  baleWeightLbs: Joi.number(),
  baleWeightKgs: Joi.number(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
  ratePerBale: Joi.number().required(),
});
const apiSchema = Joi.object({
  customerId: Joi.number().required(),
  totalAmount: Joi.number().required(),
  soldProducts: Joi.array().items(inventorySchema).required(),
});

const createSale = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  const t = await db.sequelize.transaction();
  try {
    const { soldProducts, customerId } = value;
    await db.dbConnect();
    for await (const product of soldProducts) {
      const { itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale } = product;
      const inventory = await db.Inventory.findOne({ where: { itemName }, transaction: t });
      if (inventory) {
        await inventory.decrement(["onHand"], { by: noOfBales, transaction: t });
        await inventory.update(
          {
            baleWeightLbs,
            baleWeightKgs,
            ratePerLbs,
            ratePerKgs,
            ratePerBale,
          },
          {},
          { transaction: t }
        );
      } else {
        await db.Inventory.create(
          {
            ...product,
            customerId,
            onHand: noOfBales,
          },
          { transaction: t }
        );
      }
    }
    await db.Sale.create({ ...value }, { transaction: t });
    await t.commit();
    return res.send();
  } catch (error) {
    await t.rollback();
    return res.status(500).send({ message: error.toString() });
  }
};

const getAllSales = async (req, res) => {
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const sales = await db.Sell.findAndCountAll({ ...pagination, include: [db.Customer] });

    return res.send(sales);
  } catch (error) {
    return res.status(500).send({ message: error.toString().toString() });
  }
};
export default nextConnect().use(auth).post(createSale).get(getAllSales);
