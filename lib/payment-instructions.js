export const BANK_PAYMENT_INSTRUCTIONS =
  process.env.BANK_PAYMENT_INSTRUCTIONS ||
  [
    "Meezan Bank",
    "Account title: True Refined Solutions",
    "Account no: 001234567890",
    "IBAN: PK36MEZN0000000012345678",
    "Raast ID: 03312627056",
    "Transfer the invoice amount, then submit the transaction reference and proof here for review.",
  ].join("\n");
