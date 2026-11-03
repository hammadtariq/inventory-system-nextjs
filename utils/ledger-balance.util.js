import { PAYMENT_TYPE, SPEND_TYPE } from "@/utils/api.util";

// Manual payments recorded through the ledger forms. A cash-like paymentType is what
// distinguishes a manual payment row from a purchase/sale-created row.
export const CASH_LIKE_PAYMENT_TYPES = new Set([PAYMENT_TYPE.CASH, PAYMENT_TYPE.ONLINE, PAYMENT_TYPE.CHEQUE]);

// How much one legacy (no Pay To/Pay By columns) ledger row moves a party's balance.
// Single source of truth shared by the per-row balance stored at creation (lib/ledger.js) and
// the running balance recomputed for display (pages/api/ledger/[id].js). It must stay in step
// with the legacy CASE branches of companySumQuery / customerSumQuery in query/index.js, which
// produce the page's Total Balance.
export const computeEntryDelta = (type, paymentType, spendType, amount) => {
  if (type === "company") {
    if (CASH_LIKE_PAYMENT_TYPES.has(paymentType) || spendType === SPEND_TYPE.CREDIT) return -amount;
    if (spendType === SPEND_TYPE.DEBIT) return amount;
    return 0;
  }
  // customer
  if (paymentType === PAYMENT_TYPE.REFUND) return -amount;
  if (CASH_LIKE_PAYMENT_TYPES.has(paymentType) || paymentType === PAYMENT_TYPE.INVENTORY_RETURN) return amount;
  if (spendType === SPEND_TYPE.DEBIT) return amount;
  if (spendType === SPEND_TYPE.CREDIT) return -amount;
  return 0;
};
