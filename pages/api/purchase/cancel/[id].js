import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const cancelPurchaseOrder = async (req, res) => {
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  const t = await db.sequelize.transaction();
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company] });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    await purchase.update({ status: "CANCEL" });
    return res.send();
  } catch (error) {
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(cancelPurchaseOrder);
