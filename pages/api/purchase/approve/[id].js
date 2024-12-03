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
    const { purchasedProducts, purchaseDate, companyId, totalAmount, invoiceNumber, revisionDetails, revisionNo } =
      purchase;

    if (!revisionNo) {
      updateInventory(purchasedProducts, companyId, t);
    } else {
      updateInventory(revisionDetails.purchasedProducts, companyId, t);
    }

    // Approve purchase order
    await purchase.update({ status: STATUS.APPROVED }, { transaction: t });

    // Update Ledger

    await updateLedger(revisionNo, {
      companyId,
      transactionId: id,
      totalAmount,
      purchaseDate,
      invoiceNumber,
      t,
    });
    await t.commit();
    console.log("Approve Purchase order Request End");
    return res.send();
  } catch (error) {
    await t.rollback();
    console.log("Approve Purchase order Request Error:", error);
    return res.status(500).send({ message: error.toString() });
  }
};

// Consolidated Inventory Update
const updateInventory = async (products, companyId, transaction) => {
  for await (const product of products) {
    const { id, noOfBales, baleWeightKgs, baleWeightLbs, ratePerLbs, ratePerKgs, ratePerBale } = product;

    const inventory = await db.Inventory.findOne({ where: { id, companyId }, transaction });
    if (inventory) {
      await inventory.increment({ onHand: noOfBales || 0, noOfBales: noOfBales || 0 }, { transaction });

      if (baleWeightKgs !== undefined) {
        if (inventory.baleWeightKgs === null) {
          await inventory.update({ baleWeightKgs: baleWeightKgs >= 0 ? baleWeightKgs : 0 }, { transaction });
        } else {
          await inventory.increment({ baleWeightKgs }, { transaction });
        }
      }

      if (baleWeightLbs !== undefined) {
        if (inventory.baleWeightLbs === null) {
          await inventory.update({ baleWeightLbs: baleWeightLbs >= 0 ? baleWeightLbs : 0 }, { transaction });
        } else {
          await inventory.increment({ baleWeightLbs }, { transaction });
        }
      }

      await inventory.update(
        {
          ratePerLbs: ratePerLbs || inventory.ratePerLbs,
          ratePerKgs: ratePerKgs || inventory.ratePerKgs,
          ratePerBale: ratePerBale || inventory.ratePerBale,
        },
        { transaction }
      );
    } else {
      await db.Inventory.create(
        { ...product, companyId, onHand: noOfBales || 0, baleWeightKgs, baleWeightLbs },
        { transaction }
      );
    }
  }
};

// Ledger Update Logic
const updateLedger = async (revisionNo, { companyId, transactionId, totalAmount, purchaseDate, invoiceNumber, t }) => {
  if (revisionNo !== 0) {
    const ledger = await db.Ledger.findOne({ where: { companyId, transactionId }, transaction: t });
    if (ledger) {
      await ledger.update(
        {
          amount: totalAmount,
          spendType: SPEND_TYPE.DEBIT,
          invoiceNumber,
          paymentDate: purchaseDate,
          totalBalance: totalAmount,
        },
        { transaction: t }
      );
    }
  } else {
    const balance = await balanceQuery(companyId, "company");
    const totalBalance = balance[0].amount + totalAmount;

    await db.Ledger.create(
      {
        companyId,
        amount: totalAmount,
        transactionId,
        spendType: SPEND_TYPE.DEBIT,
        invoiceNumber,
        paymentDate: purchaseDate,
        totalBalance,
      },
      { transaction: t }
    );
  }
};

export default nextConnect().use(auth).put(approvePurchaseOrder);
