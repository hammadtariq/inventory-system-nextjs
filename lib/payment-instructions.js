export const BANK_PAYMENT_INSTRUCTIONS =
  process.env.BANK_PAYMENT_INSTRUCTIONS ||
  [
    "Meezan Bank",
    "Account title: True Refined Solutions",
    "Account no: 99340112741106",
    "IBAN: Pk95MEZN0099340112741106",
    "Raast ID: 03312627056",
    "Transfer the invoice amount, then submit the transaction reference and proof here for review.",
  ].join("\n");
