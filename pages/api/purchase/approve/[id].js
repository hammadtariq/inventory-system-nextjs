import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { SPEND_TYPE, STATUS } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const handler = async (req, res) => {
  console.log("Approve Purchase order Request Start");

  try {
    const { error, value } = apiSchema.validate({ id: req.query.id });

    if (error && Object.keys(error).length) {
      return res.status(400).send({ message: error.toString() });
    }

    const { id } = value;
    if (!id) return res.status(400).json({ message: "ID is required" });
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID format" });

    const result = await approvePurchaseOrder(id, req.user);

    return res.status(result.status).send(result.body);
  } catch (error) {
    console.error("Error in approvePurchaseOrder:", error);
    return res.status(500).send({ message: error.message });
  }
};

const approvePurchaseOrder = async (id, user) => {
  if (user.role !== "ADMIN") {
    return { status: 403, body: { message: "Operation not permitted." } };
  }

  const t = await db.sequelize.transaction();
  try {
    await db.dbConnect();

    const purchase = await db.Purchase.findByPk(id, {
      include: [db.Company],
      transaction: t,
    });

    if (!purchase) {
      return { status: 404, body: { message: "Purchase order does not exist" } };
    }

    if (purchase.status === STATUS.APPROVED) {
      return { status: 400, body: { message: "Purchase order already approved" } };
    }

    const { purchasedProducts, purchaseDate, companyId, totalAmount, invoiceNumber, revisionDetails, revisionNo } =
      purchase;

    const productsToUse = revisionNo ? revisionDetails.purchasedProducts : purchasedProducts;
    const updatedInventory = await updateInventory(productsToUse, companyId, t);
    const updatedPurchaseOrder = await purchase.update({ status: STATUS.APPROVED }, { transaction: t });
    const updatedLedger = await updateLedger(revisionNo, {
      companyId,
      transactionId: id,
      totalAmount,
      purchaseDate,
      invoiceNumber,
      t,
    });

    await t.commit();

    return {
      status: 200,
      body: {
        purchaseOrder: updatedPurchaseOrder,
        inventory: updatedInventory,
        ledger: updatedLedger,
      },
    };
  } catch (error) {
    await t.rollback();
    return { status: 500, body: { message: error.message } };
  }
};

// Consolidated Inventory Update
const updateInventory = async (products, companyId, transaction) => {
  const results = [];
  for (const product of products) {
    const { id, noOfBales, baleWeightKgs, baleWeightLbs, ratePerLbs, ratePerKgs, ratePerBale } = product;

    let inventory = await db.Inventory.findOne({ where: { id, companyId }, transaction });
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
      inventory = await db.Inventory.create(
        { ...product, companyId, onHand: noOfBales || 0, baleWeightKgs, baleWeightLbs },
        { transaction }
      );
    }
    results.push(inventory); // ✅ collect updated inventory
  }
  return results;
};

// Ledger Update Logic
const updateLedger = async (revisionNo, { companyId, transactionId, totalAmount, purchaseDate, invoiceNumber, t }) => {
  if (revisionNo !== 0) {
    // === Ledger Revision ===
    const ledger = await db.Ledger.findOne({
      where: { companyId, transactionId },
      transaction: t,
    });

    if (!ledger) throw new Error("Ledger entry not found for revision.");

    const oldAmount = ledger.amount;
    const amountDiff = totalAmount - oldAmount;

    // Update the current ledger entry with the new amount and adjusted totalBalance
    await ledger.update(
      {
        amount: totalAmount,
        invoiceNumber,
        paymentDate: purchaseDate,
        totalBalance: ledger.totalBalance + amountDiff,
      },
      { transaction: t }
    );

    // Update all subsequent ledger entries to reflect the difference
    await db.Ledger.update(
      {
        totalBalance: db.sequelize.literal(`"totalBalance" + ${amountDiff}`),
      },
      {
        where: {
          companyId,
          paymentDate: { [db.Sequelize.Op.gt]: purchaseDate },
        },
        transaction: t,
      }
    );

    return ledger;
  }

  // === New Purchase Ledger Entry ===
  const balance = await balanceQuery(companyId, "company");
  const totalBalance = balance.length ? balance[0].amount + totalAmount : totalAmount;
  const ledger = await db.Ledger.create(
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
  return ledger;
};

export { handler, approvePurchaseOrder, updateInventory, updateLedger }; // 👈 add this export so it can be available to import in test file
export default nextConnect().use(auth).put(handler);
