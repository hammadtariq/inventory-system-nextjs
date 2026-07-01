export const PUBLIC_PAYMENT_PACKAGES = {
  monthly: {
    name: "Monthly",
    billing: "Flexible, no long-term commitment",
    price: "$40",
    period: "/month",
  },
  quarterly: {
    name: "Quarterly",
    billing: "Billed every 3 months",
    price: "$100",
    period: "/quarter",
  },
  annual: {
    name: "Annual",
    billing: "Billed once per year",
    price: "$350",
    period: "/year",
  },
};

export const getPublicPaymentPackage = (packageSlug) =>
  PUBLIC_PAYMENT_PACKAGES[packageSlug] || PUBLIC_PAYMENT_PACKAGES.monthly;
