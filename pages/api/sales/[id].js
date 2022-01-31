import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";
import { EDITABLE_STATUS } from "@/utils/api.util";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase(),
  noOfBales: Joi.number(),
  baleWeightLbs: Joi.number(),
  baleWeightKgs: Joi.number(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
});
const apiSchema = Joi.object({
  customerId: Joi.number(),
  totalAmount: Joi.number(),
  soldDate: Joi.date(),
  soldProducts: Joi.array().items(inventorySchema),
  id: Joi.number().required(),
});

const getSale = async (req, res) => {
  console.log("Get sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }
    console.log("Get sale order Request End");

    return res.send(sale);
  } catch (error) {
    console.log("Get sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

const updateSaleOrder = async (req, res) => {
  console.log("Update sale order Request Start");
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id);

    if (!sale) {
      return res.status(404).send({ message: "sale order not exist" });
    }

    if (!EDITABLE_STATUS.includes(sale.status)) {
      return res.status(400).send({ message: `sale order status is ${STATUS.APPROVED}` });
    }

    await sale.update({ ...value, status: STATUS.PENDING });
    console.log("Update sale order Request End");
    return res.send(sale);
  } catch (error) {
    console.log("Update sale order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateSaleOrder).get(getSale);
