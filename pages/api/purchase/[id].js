import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS, EDITABLE_STATUS } from "@/utils/api.util";

const inventorySchema = Joi.object().keys({
  itemName: Joi.string().min(3).trim().lowercase(),
  noOfBales: Joi.number(),
  baleWeightLbs: Joi.number(),
  baleWeightKgs: Joi.number(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
  ratePerBale: Joi.number(),
});
const apiSchema = Joi.object({
  companyId: Joi.number(),
  totalAmount: Joi.number(),
  surCharge: Joi.number(),
  invoiceNumber: Joi.string().trim(),
  purchaseDate: Joi.date(),
  purchasedProducts: Joi.array().items(inventorySchema),
  baleType: Joi.string().valid("SMALL_BALES", "BIG_BALES"),
  id: Joi.number().required(),
});

const getPurchaseOrder = async (req, res) => {
  console.log("Get Purchase order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company] });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    console.log("Get Purchase order Request End");

    return res.send(purchase);
  } catch (error) {
    console.log("Get Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const updatePurchaseOrder = async (req, res) => {
  console.log("Update Purchase order Request Start");
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
    const purchase = await db.Purchase.findByPk(id);

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }

    if (!EDITABLE_STATUS.includes(purchase.status)) {
      return res.status(400).send({ message: `purchase order status is ${STATUS.APPROVED}` });
    }

    await purchase.update({ ...value, status: STATUS.PENDING });
    console.log("Update Purchase order Request End");
    return res.send(purchase);
  } catch (error) {
    console.log("Update Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getPurchaseOrder).put(updatePurchaseOrder);
