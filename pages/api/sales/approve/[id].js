import Joi from "joi";
import nextConnect from "next-connect";

import db from "@/lib/postgres";
import { auth } from "@/middlewares/auth";
import { STATUS, SPEND_TYPE } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";
import { applyTenantToTransaction, createTenantTransaction } from "@/lib/tenant-transaction";

const apiSchema = Joi.object({
  id: Joi.number().required(),
});

const handler = async (req, res) => {
  console.log("Approve sale order Request Start");
  const { error, value } = apiSchema.validate({
    id: req.query.id,
  });

  if (error && Object.keys(error).length) {
    return res.status(400).send({ message: error.toString() });
  }
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    return res.status(400).send({ message: "Operation not permitted." });
  }
  try {
    const { id } = value;
    const { sale, ledger, inventory } = await approveSaleOrder(id);

    console.log("Approve sale order Request End");
    return res.status(200).json({ success: true, sale, ledger, inventory });
  } catch (error) {
    console.log("Approve sale order Request Error:", error);
    const [code, ...messageParts] = error.message.split(":");
    const message = messageParts.join(":") || error.message;
    const status = code === "NOT_FOUND" ? 404 : code === "BAD_REQUEST" ? 400 : 500;
    return res.status(status).send({ message });
  }
};

export const approveSaleOrder = async (id, t) => {
  let updatedInventories = [];
  let transaction = t;

  try {
    await db.dbConnect();
    let organizationId;
    if (transaction) {
      organizationId = await applyTenantToTransaction(transaction);
    } else {
      const tenantTransaction = await createTenantTransaction();
      transaction = tenantTransaction.transaction;
      organizationId = tenantTransaction.organizationId;
    }

    const sale = await db.Sale.findOne({
      where: { id, organizationId },
      include: [db.Customer],
      transaction,
      ...getLockOption(transaction, db.Sale),
    });

    if (!sale) throw new Error("NOT_FOUND:Sale order does not exist");
    if (sale.status === STATUS.APPROVED) throw new Error("BAD_REQUEST:Sale order already approved");
    if (sale.totalAmount === 0) throw new Error("BAD_REQUEST:Sale order cannot be approved with total amount 0.");

    const { soldProducts, soldDate, customerId, totalAmount } = sale;

    for (const product of soldProducts) {
      const { id, itemName, noOfBales, companyId, baleWeightKgs, baleWeightLbs } = product;
      validateSaleProduct(product);
      const inventory = await db.Inventory.findOne({
        where: {
          id,
          companyId,
          organizationId,
          onHand: {
            [db.Sequelize.Op.or]: {
              [db.Sequelize.Op.gte]: noOfBales,
            },
          },
        },
        transaction,
        ...getLockOption(transaction),
      });
      if (!inventory) throw new Error(`NOT_FOUND:"${itemName}" is out of stock`);

      await inventory.decrement(
        {
          onHand: noOfBales,
          baleWeightKgs,
          baleWeightLbs,
        },
        { transaction }
      );
      await inventory.reload({ transaction });
      updatedInventories.push(inventory);
    }
    await sale.update({ status: STATUS.APPROVED }, { transaction });

    const balance = await balanceQuery(customerId, "customer");

    let totalBalance;
    if (!balance.length) {
      totalBalance = totalAmount;
    } else {
      totalBalance = balance[0].amount - totalAmount;
    }

    const ledger = await db.Ledger.create(
      {
        customerId,
        transactionId: id,
        amount: totalAmount,
        spendType: SPEND_TYPE.CREDIT,
        paymentDate: soldDate,
        invoiceNumber: id,
        totalBalance: totalBalance,
        organizationId,
      },
      { transaction }
    );
    await transaction.commit();
    return { sale, ledger, inventory: updatedInventories };
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.log("Approve sale order Error:", error);
    throw error;
  }
};

const validateSaleProduct = (product) => {
  const { itemName, noOfBales, baleWeightKgs, baleWeightLbs } = product;

  if (Number(noOfBales || 0) <= 0) {
    throw new Error(`BAD_REQUEST:${itemName} sale quantity must be greater than 0`);
  }

  if (Number(baleWeightKgs || 0) < 0 || Number(baleWeightLbs || 0) < 0) {
    throw new Error(`BAD_REQUEST:${itemName} sale weights cannot be negative`);
  }
};

const getLockOption = (transaction, model) => {
  if (!transaction?.LOCK?.UPDATE) return {};

  return model ? { lock: { level: transaction.LOCK.UPDATE, of: model } } : { lock: transaction.LOCK.UPDATE };
};

export default nextConnect().use(auth).put(handler);
