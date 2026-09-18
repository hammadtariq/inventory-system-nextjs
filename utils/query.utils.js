import { companySumQuery, customerSumQuery } from "@/query/index";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

// Manual company payments (both legacy companyId-only rows and role-based Pay To/Pay By rows)
// always persist spendType: DEBIT via pages/ledger/create.js, regardless of actual direction —
// see resolveLedgerPartyFields below for why. A cash-like paymentType is what distinguishes a
// manual payment row from a real purchase-created row (paymentType blank, spendType already
// correct — purchase/approve.js sets it directly, not through this form).
export const CASH_LIKE_PAYMENT_TYPES = new Set(["CASH", "ONLINE", "CHEQUE"]);

// Resolves the pay-to/pay-by display name, the selected party's running balance, and the
// Debit/Credit display direction for one ledger row. Legacy rows (no role columns set) keep
// the existing company/customer/otherName fallback and companyTotal||totalBalance /
// customerTotal||totalBalance balance. Role-based rows resolve names from the role-specific
// associations and use payToTotal or payByTotal depending on whether the selected party is the
// Pay To or Pay By side.
//
// displaySpendType is derived rather than read directly off the row's stored spendType column:
// manual payments (pages/ledger/create.js) always persist spendType: DEBIT regardless of actual
// direction, since a single column can't represent "debit for one party, credit for the other"
// once two-party roles or legacy pay-down semantics are involved. For role-based rows, the role
// each viewed party plays is the reliable signal — Pay By is always debited, Pay To is always
// credited, mirroring the rule in lib/ledger.js's createLedgerPayment. For legacy company rows,
// a cash-like paymentType means "money paid toward the company", always a credit; anything else
// (purchase-created rows) keeps the row's own correctly-stored spendType.
export const resolveLedgerPartyFields = (row, type, id) => {
  const numericId = Number(id);
  const hasRoleColumns = Boolean(
    row.payToCompanyId || row.payToCustomerId || row.payByCompanyId || row.payByCustomerId
  );

  const nameFromParty = (company, customer) => {
    if (company) return company.companyName;
    if (customer) return `${customer.firstName} ${customer.lastName}`;
    return null;
  };

  if (!hasRoleColumns) {
    const payToName = nameFromParty(row.company, null) ?? row.otherName ?? "";
    const payByName = nameFromParty(null, row.customer) ?? row.otherName ?? "";
    // Nullish coalescing, not ||: a legitimately zero companyTotal/customerTotal must not fall
    // through to the unrelated totalBalance column (only null/undefined means "not applicable").
    const partyBalance =
      type === "company" ? row.companyTotal ?? row.totalBalance : row.customerTotal ?? row.totalBalance;
    const displaySpendType =
      type === "company" && CASH_LIKE_PAYMENT_TYPES.has(row.paymentType) ? "CREDIT" : row.spendType;

    return { payToName, payByName, partyBalance, displaySpendType };
  }

  const payToName = nameFromParty(row.payToCompany, row.payToCustomer) ?? row.otherName ?? "";
  const payByName = nameFromParty(row.payByCompany, row.payByCustomer) ?? row.otherName ?? "";
  const selectedIsPayTo = type === "company" ? row.payToCompanyId === numericId : row.payToCustomerId === numericId;
  const partyBalance = selectedIsPayTo ? row.payToTotal : row.payByTotal;
  const displaySpendType = selectedIsPayTo ? "CREDIT" : "DEBIT";

  return { payToName, payByName, partyBalance, displaySpendType };
};

export const balanceQuery = async (id, queryType, transaction) => {
  let rawQuery;
  try {
    if (queryType === "company") {
      rawQuery = companySumQuery;
    } else if (queryType === "customer") {
      rawQuery = customerSumQuery;
    } else {
      throw new Error("Invalid query type");
    }

    const organizationId = TenantContext.assertGet();
    console.log("Executing query:", rawQuery);

    const result = await db.sequelize.query(rawQuery, {
      type: db.Sequelize.QueryTypes.SELECT,
      replacements: { id, organizationId },
      ...(transaction ? { transaction } : {}),
    });

    console.log("Query result:", result);

    return result;
  } catch (error) {
    console.error("Error in balanceQuery:", error);
    throw error;
  }
};
