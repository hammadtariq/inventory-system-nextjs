import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const getSale = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }

    return res.send(sale);
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getSale);
