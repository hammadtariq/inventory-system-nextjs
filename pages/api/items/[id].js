import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

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

  const { error, value } = apiSchema.validate({
    ...req.body,
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();

    const item = await db.Items.findByPk(value.id);
    if (!item) {
      return res.status(404).send({ message: "item not found" });
    }
    if (!Object.keys(req.body).length) {
      res.status(400).send({
        message: "Please provide at least one field",
        allowedFields: ["itemName", "companyId", "ratePerLbs", "ratePerKgs", "ratePerBale", "type"],
      });
    }

    await item.update({ ...value });
    console.log("update items Request End");

    return res.send();
  } catch (error) {
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
    return res.status(400).send({ message: error });
  }

  try {
    await db.dbConnect();
    const item = await db.Items.findByPk(value.id);

    if (!item) {
      return res.status(404).send({ message: "item does not exist" });
    }

    await db.Items.destroy({ where: { id: value.id } });
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
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const item = await db.Items.findByPk(id, { include: [db.Company] });

    if (!item) {
      return res.status(409).send({ message: "item not exist" });
    }
    console.log("get items Request End");
    return res.send(item);
  } catch (error) {
    console.log("get items Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(updateItems).delete(deleteItem).get(getItem);
