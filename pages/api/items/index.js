import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  companyId: Joi.number().required(),
  itemName: Joi.string().min(3).trim().lowercase().required(),
  ratePerLbs: Joi.number(),
  ratePerKgs: Joi.number(),
  ratePerBale: Joi.number(),
  type: Joi.string().valid("SMALL_BALES", "BIG_BALES").required(),
});

const createItem = async (req, res) => {
  const { error, value } = apiSchema.validate(req.body);
  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    const { itemName, companyId, type, ratePerBale } = value;

    if (type === "SMALL_BALES") {
      const { value } = Joi.number().required().validate(ratePerBale);
      if (!value) {
        return res.status(400).send({ message: "rate per bale is required for type SMALL_BALES" });
      }
    }

    await db.dbConnect();
    const item = await db.Items.findOne({ where: { itemName, companyId, type } });
    if (item) {
      return res.status(409).send({ message: "item already exist in list" });
    }
    await db.Items.create({
      ...value,
    });

    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

const getAllItems = async (req, res) => {
  const { limit, offset, companyId: cid, type: listType } = req.query;
  const options = {};
  const companyId = JSON.parse(cid);
  const type = JSON.parse(listType);
  options.limit = limit ? limit : 10;
  options.offset = offset ? offset : 0;
  if (companyId && type) {
    options.where = {
      companyId,
      type,
    };
  } else if (companyId) {
    options.where = {
      companyId,
    };
  } else if (type) {
    options.where = {
      type,
    };
  }
  try {
    await db.dbConnect();
    const data = await db.Items.findAndCountAll(options);

    return res.send(data);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};
export default nextConnect().use(auth).post(createItem).get(getAllItems);
