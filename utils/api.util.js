export const STATUS = {
  APPROVED: "APPROVED",
  PENDING: "PENDING",
  CANCEL: "CANCEL",
};

export const SPEND_TYPE = {
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
};

export const PAYMENT_TYPE = {
  CASH: "CASH",
  ONLINE: "ONLINE",
  CHEQUE: "CHEQUE",
};

export const EDITABLE_STATUS = [STATUS.CANCEL, STATUS.PENDING];

export const DEFAULT_ROWS_LIMIT = 1000;

export const calculateAmount = (totalAmount, a) => {
  if (a.onHand) {
    if (a.ratePerKgs && a.baleWeightKgs) {
      totalAmount += Number(a.ratePerKgs * a.baleWeightKgs);
    } else if (a.ratePerLbs && a.baleWeightLbs) {
      totalAmount += Number(a.ratePerLbs * a.baleWeightLbs);
    } else if (a.onHand && a.ratePerBale) {
      totalAmount += Number(a.onHand * a.ratePerBale);
    }
  } else {
    if (a.ratePerKgs && a.baleWeightKgs) {
      totalAmount += Number(a.ratePerKgs * a.baleWeightKgs);
    } else if (a.ratePerLbs && a.baleWeightLbs) {
      totalAmount += Number(a.ratePerLbs * a.baleWeightLbs);
    } else if (a.ratePerBale && a.noOfBales) {
      totalAmount += Number(a.noOfBales * a.ratePerBale);
    }
  }
  return totalAmount;
};

// Helper function to clean item names
export const cleanItemName = (name) => name?.replace(/\s*\(.*?\)/, "").trim() || null;
