// Manual payments recorded through the ledger forms. A cash-like paymentType is what
// distinguishes a manual payment row from a purchase/sale-created row.
export const CASH_LIKE_PAYMENT_TYPES = new Set(["CASH", "ONLINE", "CHEQUE"]);

// How much one legacy (no Pay To/Pay By columns) ledger row moves a party's balance.
// Single source of truth shared by the per-row balance stored at creation (lib/ledger.js) and
// the running balance recomputed for display (pages/api/ledger/[id].js). It must stay in step
// with the legacy CASE branches of companySumQuery / customerSumQuery in query/index.js, which
// produce the page's Total Balance.
export const computeEntryDelta = (type, paymentType, spendType, amount) => {
  if (type === "company") {
    if (CASH_LIKE_PAYMENT_TYPES.has(paymentType) || spendType === "CREDIT") return -amount;
    if (spendType === "DEBIT") return amount;
    return 0;
  }
  // customer
  if (paymentType === "REFUND") return -amount;
  if (CASH_LIKE_PAYMENT_TYPES.has(paymentType) || paymentType === "INVENTORY_RETURN") return amount;
  if (spendType === "DEBIT") return amount;
  if (spendType === "CREDIT") return -amount;
  return 0;
};
