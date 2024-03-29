import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const cancelPurchaseOrder = async (req, res) => {
  console.log("Cancel Purchase order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const purchase = await db.Purchase.findByPk(id);

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    await purchase.update({ status: STATUS.CANCEL });
    console.log("Cancel Purchase order Request End");
    return res.send();
  } catch (error) {
    console.log("Cancel Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(cancelPurchaseOrder);
