import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";

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
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  try {
    await db.dbConnect();
    const organizationId = TenantContext.assertGet();
    const { id } = value;
    const sale = await db.Sale.findOne({ where: { id, organizationId } });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exist" });
    }

    if (sale.status === STATUS.APPROVED) {
      return res.status(400).send({ message: "Approved sale orders cannot be cancelled without reversal." });
    }

    await sale.update({ status: STATUS.CANCEL });
    console.log("Cancel Sale order Request End");
    return res.send();
  } catch (error) {
    console.log("Cancel Sale order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export { cancelSaleOrder };
export default nextConnect().use(auth).put(cancelSaleOrder);
