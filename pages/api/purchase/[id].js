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
    return res.status(500).send({ message: error.toString() });
  }
};

const approvePurchaseOrder = async (req, res) => {
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
    const { purchasedProducts, companyId } = purchase;
    for await (const product of purchasedProducts) {
      const { itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale } = product;
      const inventory = await db.Inventory.findOne({ where: { itemName }, transaction: t });
      if (inventory) {
        await inventory.increment(["onHand", "noOfBales"], { by: noOfBales, transaction: t });
        await inventory.update(
          {
            baleWeightLbs,
            baleWeightKgs,
            ratePerLbs,
            ratePerKgs,
            ratePerBale,
          },
          {},
          { transaction: t }
        );
      } else {
        await db.Inventory.create(
          {
            ...product,
            companyId,
            onHand: noOfBales,
          },
          { transaction: t }
        );
      }
    }
    await purchase.update({ status: "APPROVED" });
    await t.commit();
    return res.send();
  } catch (error) {
    await t.rollback();
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).get(getPurchaseOrder).put(approvePurchaseOrder);
