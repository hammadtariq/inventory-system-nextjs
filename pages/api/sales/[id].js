import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS } from "@/utils/api.util";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const getSale = async (req, res) => {
  console.log("Get sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  try {
    await db.dbConnect();
    const { id } = value;
    const sale = await db.Sale.findByPk(id, { include: [db.Customer] });

    if (!sale) {
      return res.status(404).send({ message: "sale order not exists" });
    }
    console.log("Get sale order Request End");

    return res.send(sale);
  } catch (error) {
    console.log("Get sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

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
    const { soldProducts } = sale;
    await db.dbConnect();
    for await (const product of soldProducts) {
      const { itemName, noOfBales } = product;
      const inventory = await db.Inventory.findOne({
        where: {
          itemName,
          onHand: {
            [db.Sequelize.Op.or]: {
              [db.Sequelize.Op.gt]: noOfBales,
              [db.Sequelize.Op.eq]: noOfBales,
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
    await sale.update({ status: STATUS.APPROVED });
    await t.commit();
    console.log("Approve sale order Request End");
    return res.send();
  } catch (error) {
    await t.rollback();
    console.log("Approve sale order Request Error:", error);

    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(approveSaleOrder).get(getSale);
