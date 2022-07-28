import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const cancelSaleOrder = async (req, res) => {
  console.log("Cancel Sale order Request Start");
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
    const sale = await db.Sale.findByPk(id);

    if (!sale) {
      return res.status(404).send({ message: "sale order not exist" });
    }
    await sale.update({ status: STATUS.CANCEL });
    console.log("Cancel Sale order Request End");
    return res.send();
  } catch (error) {
    console.log("Cancel Sale order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(cancelSaleOrder);
