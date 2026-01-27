import db from "@/lib/postgres";
import { SPEND_TYPE } from "@/utils/api.util";

const getEntryDelta = (entry, entityType) => {
  if (entry.paymentType) {
    return entityType === "customer" ? entry.amount : -entry.amount;
  }
  if (entry.spendType === SPEND_TYPE.DEBIT) return entry.amount;
  if (entry.spendType === SPEND_TYPE.CREDIT) return -entry.amount;
  return 0;
};

export const recalculateLedgerForEntity = async ({ entityType, entityId, transaction }) => {
  const condition = entityType === "company" ? { companyId: entityId } : { customerId: entityId };
  const entries = await db.Ledger.findAll({
    where: condition,
    order: [
      ["paymentDate", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  let runningBalance = 0;
  for (const entry of entries) {
    runningBalance += getEntryDelta(entry, entityType);
    const update = { totalBalance: runningBalance };
    if (entityType === "company") {
      update.companyTotal = runningBalance;
    } else {
      update.customerTotal = runningBalance;
    }
    await entry.update(update, { transaction });
  }

  return entries;
};
