import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  productName: Joi.string().trim().lowercase(),
  productLabel: Joi.string().trim().lowercase(),
  bundleCount: Joi.number(),
  bundleWeight: Joi.number(),
  bundleCost: Joi.number(),
  id: Joi.number().required(),
});

const updateInventory = async (req, res) => {
  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();

    const inventory = await db.Inventory.findByPk(value.id);
    if (!inventory) {
      return res.status(404).send({ message: "inventory not found" });
    }
    if (!Object.keys(req.body).length) {
      res.status(400).send({
        message: "Please provide at least one field",
        allowedFields: ["productName", "productLabel"],
      });
    }

    await inventory.update({ ...value });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

const deleteInventory = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const inventory = await db.Inventory.findByPk(value.id);

    if (!inventory) {
      return res.status(404).send({ message: "inventory does not exist" });
    }
    if (inventory.onHand > 0) {
      return res.status(400).send({ message: "inventory stock exist unable to delete" });
    }
    await db.Inventory.destroy({ where: { id: value.id } });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

const getInventory = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const inventory = await db.Inventory.findOne({
      where: { id },
    });

    if (!inventory) {
      return res.status(404).send({ message: "inventory not exist" });
    }

    return res.send(inventory);
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

export default nextConnect().use(auth).put(updateInventory).delete(deleteInventory).get(getInventory);
