import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { pickDefinedFields } from "@/lib/request-fields";
import { auth } from "@/middlewares/auth";
import TenantContext from "@/lib/tenant-context";
import { createTenantTransaction } from "@/lib/tenant-transaction";

const updateFields = ["itemName", "companyId", "ratePerLbs", "ratePerKgs", "ratePerBale", "type"];

const apiSchema = Joi.object({
  companyId: Joi.number(),
  itemName: Joi.string().min(3).trim().lowercase(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
  ratePerBale: Joi.number(),
  type: Joi.string().valid("SMALL_BALES", "BIG_BALES"),
  id: Joi.number().required(),
});

const updateItems = async (req, res) => {
  console.log("update items Request Start");

  const validateInput = pickDefinedFields(req.body, updateFields);
  validateInput.id = req.query.id;
  const { error, value } = apiSchema.validate(validateInput);

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  let t;
  try {
    await db.dbConnect();
    const tenantTransaction = await createTenantTransaction();
    t = tenantTransaction.transaction;
    const { organizationId } = tenantTransaction;

    const item = await db.Items.findOne({ where: { id: value.id, organizationId }, transaction: t });
    const inventoryItem = await db.Inventory.findOne({ where: { id: value.id, organizationId }, transaction: t });

    if (!item) {
      await t.rollback();
      return res.status(404).send({ message: "item not found" });
    }

    if (value.companyId) {
      const company = await db.Company.findOne({ where: { id: value.companyId, organizationId }, transaction: t });
      if (!company) {
        await t.rollback();
        return res.status(404).send({ message: "company not found" });
      }
    }

    if (!Object.keys(req.body).length) {
      await t.rollback();
      return res.status(400).send({
        message: "Please provide at least one field",
        allowedFields: updateFields,
      });
    }
    const updateData = pickDefinedFields(value, updateFields);
    await item.update(updateData, { transaction: t });
    console.log("update items Request End");

    if (inventoryItem) {
      await inventoryItem.update(updateData, { transaction: t });
      console.log("update inventory Request End");
    }
    await t.commit();
    return res.send();
  } catch (error) {
    if (t) await t.rollback();
    console.log("update items Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const deleteItem = async (req, res) => {
  console.log("delete items Request Start");

  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }

  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const item = await db.Items.findOne({ where: { id: value.id, organizationId } });

    if (!item) {
      return res.status(404).send({ message: "item does not exist" });
    }

    await db.Items.destroy({ where: { id: value.id, organizationId } });
    console.log("delete items Request End");

    return res.send();
  } catch (error) {
    console.log("delete items Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

const getItem = async (req, res) => {
  console.log("get items Request Start");

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
    const item = await db.Items.findOne({ where: { id, organizationId }, include: [db.Company] });

    if (!item) {
      return res.status(404).send({ message: "item not exist" });
    }
    console.log("get items Request End");
    return res.send(item);
  } catch (error) {
    console.log("get items Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateItems).delete(deleteItem).get(getItem);
