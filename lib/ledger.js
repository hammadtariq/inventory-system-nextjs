import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
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
    payToCompanyId = null,
    payToCustomerId = null,
    payByCompanyId = null,
    payByCustomerId = null,
  },
  transaction
) => {
  const organizationId = TenantContext.assertGet();

  const hasRoleFields = Boolean(payToCompanyId || payToCustomerId || payByCompanyId || payByCustomerId);
  // The legacy Pay To Company / Pay By Customer combo is the only role shape that also
  // populates the legacy companyId/customerId columns. Reversed and same-type combos
  // (Customer/Company, Company/Company, Customer/Customer) never set payByCompanyId or
  // payToCustomerId, so their absence is what identifies the legacy shape.
  const isLegacyCombo = hasRoleFields && !payByCompanyId && !payToCustomerId;

  const ledgerData = {
    amount: totalAmount,
    spendType,
    transactionId,
    paymentType,
    paymentDate,
    invoiceNumber,
    otherName,
    reference,
    organizationId,
  };

  if (!hasRoleFields || isLegacyCombo) {
    const legacyCompanyId = hasRoleFields ? payToCompanyId : companyId;
    const legacyCustomerId = hasRoleFields ? payByCustomerId : customerId;

    const companyBalance = legacyCompanyId ? await balanceQuery(legacyCompanyId, "company", transaction) : [];
    const customerBalance = legacyCustomerId ? await balanceQuery(legacyCustomerId, "customer", transaction) : [];

    let companyTotal = totalAmount;
    let customerTotal = totalAmount;

    if (paymentType) {
      if (companyBalance.length) {
        companyTotal = companyBalance[0].amount - totalAmount;
      }
      if (customerBalance.length) {
        customerTotal =
          paymentType === "REFUND" ? customerBalance[0].amount + totalAmount : customerBalance[0].amount - totalAmount;
      }
    }

    ledgerData.companyId = legacyCompanyId;
    ledgerData.customerId = legacyCustomerId;
    ledgerData.companyTotal = companyTotal;
    ledgerData.customerTotal = customerTotal;
    ledgerData.totalBalance = companyTotal;
  }

  if (hasRoleFields) {
    ledgerData.payToCompanyId = payToCompanyId || null;
    ledgerData.payToCustomerId = payToCustomerId || null;
    ledgerData.payByCompanyId = payByCompanyId || null;
    ledgerData.payByCustomerId = payByCustomerId || null;

    // Debit/Credit rule (all four Pay To/Pay By combos, including the legacy Company/Customer
    // shape): Pay By is always debited (balance increases by the amount), Pay To is always
    // credited (balance decreases), regardless of whether each side is a company or customer.
    const payToType = payToCompanyId ? "company" : "customer";
    const payToId = payToCompanyId || payToCustomerId;
    const payByType = payByCompanyId ? "company" : "customer";
    const payById = payByCompanyId || payByCustomerId;

    const payToBalance = await balanceQuery(payToId, payToType, transaction);
    const payByBalance = await balanceQuery(payById, payByType, transaction);

    ledgerData.payToTotal = (payToBalance.length ? payToBalance[0].amount : 0) - totalAmount;
    ledgerData.payByTotal = (payByBalance.length ? payByBalance[0].amount : 0) + totalAmount;
  }

  return db.Ledger.create(ledgerData, transaction ? { transaction } : undefined);
};
