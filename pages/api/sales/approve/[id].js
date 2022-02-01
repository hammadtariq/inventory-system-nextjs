import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS, SPEND_TYPE } from "@/utils/api.util";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const approveSaleOrder = async (req, res) => {
  console.log("Approve sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  const t = await db.sequelize.transaction();
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }

    if (sale.status === STATUS.APPROVED) {
      return res.status(400).send({ message: "sale order already approved" });
    }

    const { soldProducts, customerId, totalAmount } = sale;
    await db.dbConnect();
    for await (const product of soldProducts) {
      const { itemName, noOfBales, companyId } = product;
      const inventory = await db.Inventory.findOne({
        where: {
          itemName,
          companyId,
          onHand: {
            [db.Sequelize.Op.or]: {
              [db.Sequelize.Op.gte]: noOfBales,
            },
          },
        },
        transaction: t,
      });
      if (!inventory) {
        return res.status(404).send({ message: `"${itemName}" out of stock` });
      }
      await inventory.decrement(["onHand"], { by: noOfBales, transaction: t });
    }
    await sale.update({ status: STATUS.APPROVED }, { transaction: t });
    await db.Ledger.create(
      {
        customerId,
        amount: totalAmount,
        spendType: SPEND_TYPE.CREDIT,
      },
      { transaction: t }
    );
    await t.commit();
    console.log("Approve sale order Request End");
    return res.send();
  } catch (error) {
    await t.rollback();
    console.log("Approve sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(approveSaleOrder);
