import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  productName: Joi.string().trim().lowercase().required(),
  productLabel: Joi.string().trim().lowercase().required(),
  bundleCount: Joi.number().required(),
  bundleWeight: Joi.number().required(),
  bundleCost: Joi.number().required(),
  received: Joi.number(),
  onHand: Joi.number(),
});

const createInventory = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const inventory = await db.Inventory.findOne({ where: { productLabel: value.productLabel } });
    if (inventory) {
      return res.status(409).send({ message: `product with label ${value.productLabel} is already exist.` });
    }

    await db.Inventory.create({
      ...value,
    });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

const getAllInventory = async (req, res) => {
  const { limit, offset } = req.query;
  const pagination = {};
  pagination.limit = limit ? limit : 10;
  pagination.offset = offset ? offset : 0;
  try {
    await db.dbConnect();
    const data = await db.Inventory.findAndCountAll(pagination);

    return res.send(data);
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};
export default nextConnect().use(auth).post(createInventory).get(getAllInventory);
