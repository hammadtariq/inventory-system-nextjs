import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const deleteInventory = async (req, res) => {
  console.log("delete inventory Request Start");

  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
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
    console.log("delete inventory Request End");

    return res.send();
  } catch (error) {
    console.log("delete inventory Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const getInventory = async (req, res) => {
  console.log("get inventory Request Start");

  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const inventory = await db.Inventory.findByPk(id, { include: [db.Company] });

    if (!inventory) {
      return res.status(404).send({ message: "inventory not exist" });
    }
    console.log("get inventory Request End");

    return res.send(inventory);
  } catch (error) {
    console.log("get inventory Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).delete(deleteInventory).get(getInventory);
