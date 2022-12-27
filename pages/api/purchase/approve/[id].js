import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { SPEND_TYPE, STATUS } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const approvePurchaseOrder = async (req, res) => {
  console.log("Approve Purchase order Request Start");

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
    const purchase = await db.Purchase.findByPk(id, { include: [db.Company], transaction: t });

    if (!purchase) {
      return res.status(404).send({ message: "purchase order not exist" });
    }
    if (purchase.status === STATUS.APPROVED) {
      return res.status(400).send({ message: "purchase order already approved" });
    }
    const { purchasedProducts, purchaseDate, companyId, totalAmount, invoiceNumber } = purchase;

    for await (const product of purchasedProducts) {
      const { id, itemName, noOfBales, baleWeightLbs, baleWeightKgs, ratePerLbs, ratePerKgs, ratePerBale } = product;
      // TODO: testing id for this query is itemName was causing issues
      // const inventory = await db.Inventory.findOne({ where: { itemName, companyId }, transaction: t });
      const inventory = await db.Inventory.findOne({ where: { id, companyId }, transaction: t });
      if (inventory) {
        let incrementQuery = { baleWeightKgs, baleWeightLbs };

        await inventory.increment(["onHand", "noOfBales"], { by: noOfBales, transaction: t });
        await inventory.increment(incrementQuery, { transaction: t });
        await inventory.update(
          {
            ratePerLbs,
            ratePerKgs,
            ratePerBale,
          },
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
    await purchase.update({ status: STATUS.APPROVED }, { transaction: t });

    const balance = balanceQuery(companyId, "company");

    let totalBalance;

    if (!balance.length) {
      totalBalance = totalAmount;
    } else {
      totalBalance = balance[0].amount - totalAmount;
    }
    debugger;

    await db.Ledger.create(
      {
        companyId,
        amount: totalAmount,
        transactionId: id,
        spendType: SPEND_TYPE.CREDIT,
        invoiceNumber,
        paymentDate: purchaseDate,
        totalBalance: totalBalance,
      },
      { transaction: t }
    );
    await t.commit();
    console.log("Approve Purchase order Request End");
    return res.send();
  } catch (error) {
    await t.rollback();
    console.log("Approve Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

export default nextConnect().use(auth).put(approvePurchaseOrder);
