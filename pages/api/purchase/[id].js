import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const getPurchaseOrder = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company] });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }

    return res.send(purchase);
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

export default nextConnect().use(auth).get(getPurchaseOrder);
