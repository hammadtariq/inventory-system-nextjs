import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { pickDefinedFields } from "@/lib/request-fields";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";

const updateFields = ["itemName"];

const apiSchema = Joi.object({
  id: Joi.number().required(),
  itemName: Joi.string().min(3).trim(),
});

export const updateInventory = async (req, res) => {
  console.log("update inventory Request Start");

  const validateInput = pickDefinedFields(req.body, updateFields);
  validateInput.id = req.query.id;
  const { error, value } = apiSchema.validate(validateInput);

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();

    const inventoryItem = await db.Inventory.findOne({ where: { id: value.id, organizationId } });
    if (!inventoryItem) {
      return res.status(404).send({ message: "inventory item not found" });
    }
    const updateData = {};

    for (const key of updateFields) {
      if (value[key]) {
        updateData[key] = value[key];
      }
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).send({
        message: "No valid fields provided to update.",
        allowedFields: updateFields,
      });
    }

    await inventoryItem.update(updateData);
    console.log("update inventory Request End");

    return res.send();
  } catch (error) {
    console.log("update inventory Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

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
    const organizationId = TenantContext.assertGet();
    const inventory = await db.Inventory.findOne({ where: { id: value.id, organizationId } });

    if (!inventory) {
      return res.status(404).send({ message: "inventory does not exist" });
    }
    if (inventory.onHand > 0) {
      return res.status(400).send({ message: "inventory stock exist unable to delete" });
    }
    await db.Inventory.destroy({ where: { id: value.id, organizationId } });
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
    const organizationId = TenantContext.assertGet();
    const { id } = value;
    const inventory = await db.Inventory.findOne({ where: { id, organizationId }, include: [db.Company] });

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

export default nextConnect().use(auth).delete(deleteInventory).get(getInventory).put(updateInventory);
