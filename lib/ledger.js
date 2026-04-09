import db from "@/lib/postgres";
import { balanceQuery } from "@/utils/query.utils";

export const createLedgerPayment = async (
  {
    totalAmount,
    reference,
    companyId,
    spendType,
    customerId,
    paymentType,
    paymentDate,
    otherName = "",
    transactionId = null,
    invoiceNumber = null,
  },
  transaction
) => {
  const companyBalance = companyId ? await balanceQuery(companyId, "company", transaction) : [];
  const customerBalance = customerId ? await balanceQuery(customerId, "customer", transaction) : [];

  let companyTotal = totalAmount;
  let customerTotal = totalAmount;

  if (paymentType) {
    if (companyBalance.length) {
      companyTotal = companyBalance[0].amount - totalAmount;
    }
    if (customerBalance.length) {
      customerTotal = customerBalance[0].amount + totalAmount;
    }
  }

  return db.Ledger.create(
    {
      companyId,
      amount: totalAmount,
      spendType,
      customerId,
      transactionId,
      paymentType,
      paymentDate,
      invoiceNumber,
      totalBalance: companyTotal,
      companyTotal,
      customerTotal,
      otherName,
      reference,
    },
    transaction ? { transaction } : undefined
  );
};
