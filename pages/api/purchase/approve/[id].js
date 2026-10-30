import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { requireRole, AuthzError, onError } from "@/lib/authz";
import { SPEND_TYPE, STATUS } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";
import TenantContext from "@/lib/tenant-context";
import { createTenantTransaction } from "@/lib/tenant-transaction";

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
  try {
    requireRole("ADMIN", "SUPER_ADMIN")(user);
  } catch (err) {
    if (err instanceof AuthzError) return { status: err.status, body: { message: err.message } };
    throw err;
  }

  let t;
  try {
    await db.dbConnect();
    const tenantTransaction = await createTenantTransaction();
    t = tenantTransaction.transaction;
    const { organizationId } = tenantTransaction;

    const purchase = await db.Purchase.findOne({
      where: { id, organizationId },
      include: [db.Company],
      transaction: t,
      ...getLockOption(t, db.Purchase),
    });

    if (!purchase) {
      await t.rollback();
      return { status: 404, body: { message: "Purchase order does not exist" } };
    }

    if (purchase.status === STATUS.APPROVED) {
      await t.rollback();
      return { status: 400, body: { message: "Purchase order already approved" } };
    }

    const { purchasedProducts, purchaseDate, companyId, totalAmount, invoiceNumber, revisionDetails, revisionNo } =
      purchase;

    const productsToUse = revisionNo
      ? buildRevisionInventoryAdjustments(revisionDetails, purchasedProducts || [])
      : purchasedProducts;
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
    if (t) await t.rollback();
    return { status: 500, body: { message: error.message } };
  }
};

// Consolidated Inventory Update
// Each query is a round trip to the database, so lock every affected row in one read, apply the purchase lines
// in memory, then write each row once: one UPDATE per changed row and one INSERT for all new items. #257
const updateInventory = async (products, companyId, transaction) => {
  const organizationId = TenantContext.assertGet();
  const ids = [...new Set(products.map((product) => Number(product.id)))];

  const inStock = await db.Inventory.findAll({
    where: { id: ids, companyId, organizationId },
    transaction,
    ...getLockOption(transaction),
  });
  const existing = new Map(inStock.map((inventory) => [inventory.id, inventory]));
  const pending = new Map();

  for (const product of products) {
    const id = Number(product.id);
    const inventory = existing.get(id);

    if (inventory) {
      inventory.set(addPurchaseLine(inventory.get({ plain: true }), product));
    } else if (pending.has(id)) {
      pending.set(id, addPurchaseLine(pending.get(id), product));
    } else {
      pending.set(id, newStockRow(product, companyId, organizationId));
    }
  }

  for (const inventory of existing.values()) {
    await inventory.save({ transaction });
  }

  const created = pending.size
    ? await db.Inventory.bulkCreate([...pending.values()], { transaction, validate: true })
    : [];
  const rows = new Map([...existing, ...created.map((inventory) => [inventory.id, inventory])]);

  return products.map((product) => rows.get(Number(product.id)));
};

const WEIGHT_FIELDS = ["baleWeightKgs", "baleWeightLbs"];

// A missing or null weight leaves the stored weight as it is. An empty stored weight takes the purchased weight,
// never below zero.
const addPurchaseLine = (stock, product) => {
  const bales = Number(product.noOfBales) || 0;
  const next = {
    ...stock,
    onHand: stock.onHand + bales,
    noOfBales: stock.noOfBales + bales,
    ratePerLbs: product.ratePerLbs || stock.ratePerLbs,
    ratePerKgs: product.ratePerKgs || stock.ratePerKgs,
    ratePerBale: product.ratePerBale || stock.ratePerBale,
  };

  for (const field of WEIGHT_FIELDS) {
    if (product[field] === undefined || product[field] === null) continue;

    const weight = Number(product[field]);
    next[field] = stock[field] === null ? Math.max(weight, 0) : stock[field] + weight;
  }

  return next;
};

const newStockRow = (product, companyId, organizationId) => {
  const bales = Number(product.noOfBales) || 0;
  const row = { ...product, id: Number(product.id), companyId, organizationId, onHand: bales, noOfBales: bales };

  for (const field of WEIGHT_FIELDS) {
    row[field] = product[field] === undefined || product[field] === null ? null : Number(product[field]);
  }

  return row;
};

// Ledger Update Logic
const updateLedger = async (revisionNo, { companyId, transactionId, totalAmount, purchaseDate, invoiceNumber, t }) => {
  const organizationId = TenantContext.assertGet();

  if (revisionNo !== 0) {
    // === Ledger Revision ===
    const ledger = await db.Ledger.findOne({
      where: { companyId, transactionId, organizationId },
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

    // Update all subsequent ledger entries to reflect the difference.
    // Also update companyTotal where it is set (payment entries), since the UI
    // prefers companyTotal over totalBalance for those rows.
    await db.Ledger.update(
      {
        totalBalance: db.sequelize.literal(`"totalBalance" + ${amountDiff}`),
        companyTotal: db.sequelize.literal(
          `CASE WHEN "companyTotal" IS NOT NULL THEN "companyTotal" + ${amountDiff} ELSE NULL END`
        ),
      },
      {
        where: {
          companyId,
          organizationId,
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
      organizationId,
    },
    { transaction: t }
  );
  return ledger;
};

const getLockOption = (transaction, model) => {
  if (!transaction?.LOCK?.UPDATE) return {};

  return model ? { lock: { level: transaction.LOCK.UPDATE, of: model } } : { lock: transaction.LOCK.UPDATE };
};

const buildRevisionInventoryAdjustments = (revisionDetails, originalProducts) => {
  const revisionProducts = revisionDetails?.purchasedProducts || [];
  const usesDeltaValues = Array.isArray(revisionDetails?.previousPurchasedProducts);

  return hydrateRevisedProducts(revisionProducts, originalProducts, usesDeltaValues);
};

const buildStockValue = (product, field, usesDeltaValues) => {
  if (!usesDeltaValues) {
    return product[field];
  }

  if (!Object.prototype.hasOwnProperty.call(product, field)) {
    return field === "noOfBales" ? 0 : undefined;
  }

  return product[field];
};

const hydrateRevisedProducts = (revisionProducts, originalProducts, usesDeltaValues = false) => {
  return revisionProducts.map((product) => {
    const productId = Number(product.id);
    const productCompanyId = product.companyId != null ? Number(product.companyId) : null;
    const originalProduct =
      originalProducts.find(
        (item) =>
          Number(item.id) === productId &&
          (productCompanyId === null || item.companyId == null || Number(item.companyId) === productCompanyId)
      ) || originalProducts.find((item) => Number(item.id) === productId);

    if (!originalProduct) {
      return product;
    }

    return {
      ...originalProduct,
      ...product,
      itemName: product.itemName ?? originalProduct.itemName,
      companyId: product.companyId ?? originalProduct.companyId,
      noOfBales: buildStockValue(product, "noOfBales", usesDeltaValues),
      baleWeightKgs: buildStockValue(product, "baleWeightKgs", usesDeltaValues),
      baleWeightLbs: buildStockValue(product, "baleWeightLbs", usesDeltaValues),
    };
  });
};

// Approval runs several sequential queries per product, which outgrows Vercel's 10s default on large purchases.
export const config = { maxDuration: 60 };

export { handler, approvePurchaseOrder, updateInventory, updateLedger };
export default nextConnect({ onError }).use(auth).put(handler);
