const Joi = require("joi");
const {
  createRng,
  generateCompanies,
  generateCustomers,
  generateItemsForCompany,
  generateInventoryForCompany,
  generatePurchase,
  generateSale,
  buildLedgerAndCheques,
} = require("@/scripts/seed-demo-organization-generator");

const DATE_RANGE = { start: new Date("2025-07-01"), end: new Date("2026-07-01") };

// Same schema pages/api/user/login.js validates against — Joi's email TLD
// allow-list rejects RFC 2606's bare .example TLD (only example.com/net/org
// second-level domains are safe), which is what broke the demo logins once.
const emailSchema = Joi.string().email();

describe("seed-demo-organization-generator", () => {
  it("generates the requested number of companies with unique names and organization-scoped emails that pass the login route's Joi email validation", () => {
    const rng = createRng(1);
    const companies = generateCompanies(rng, "drift-warehouse-demo", 55);

    expect(companies).toHaveLength(55);
    expect(new Set(companies.map((c) => c.companyName)).size).toBe(55);
    companies.forEach((c) => {
      expect(c.email.endsWith("@drift-warehouse-demo-vendor.example.com")).toBe(true);
      expect(emailSchema.validate(c.email).error).toBeUndefined();
      expect(c.uuid).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  it("generates the requested number of customers with unique emails that pass Joi email validation", () => {
    const rng = createRng(2);
    const customers = generateCustomers(rng, "drift-warehouse-demo", 55);

    expect(customers).toHaveLength(55);
    expect(new Set(customers.map((c) => c.email)).size).toBe(55);
    customers.forEach((c) => {
      expect(c.firstName.length).toBeGreaterThanOrEqual(3);
      expect(c.lastName.length).toBeGreaterThanOrEqual(3);
      expect(emailSchema.validate(c.email).error).toBeUndefined();
    });
  });

  it("generates items with a valid bale type and exactly one rate populated", () => {
    const rng = createRng(3);
    const items = generateItemsForCompany(rng, { id: 1 });

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.length).toBeLessThanOrEqual(3);
    items.forEach((item) => {
      expect(["SMALL_BALES", "BIG_BALES"]).toContain(item.type);
      const rateCount = [item.ratePerLbs, item.ratePerKgs, item.ratePerBale].filter((v) => v !== null).length;
      expect(rateCount).toBe(1);
    });
  });

  it("gives inventory rows the same id as the item they were stocked from", () => {
    const rng = createRng(4);
    const items = [
      { id: 42, itemName: "cotton rags industrial", ratePerLbs: 1.2, ratePerKgs: null, ratePerBale: null },
      { id: 43, itemName: "denim jeans grade a", ratePerLbs: null, ratePerKgs: null, ratePerBale: 90 },
    ];
    const inventory = generateInventoryForCompany(rng, { id: 1 }, items);

    expect(inventory.map((i) => i.id)).toEqual([42, 43]);
    inventory.forEach((row) => {
      expect(row.onHand).toBeLessThanOrEqual(row.noOfBales);
      expect(row.onHand).toBeGreaterThanOrEqual(0);
    });
  });

  it("generates a purchase whose purchasedProducts reference only the given company's items", () => {
    const rng = createRng(5);
    const company = { id: 7 };
    const items = [
      { id: 100, itemName: "shoes mixed grade b", ratePerLbs: 0.9, ratePerKgs: null, ratePerBale: null },
      { id: 101, itemName: "bath towels", ratePerLbs: null, ratePerKgs: 2.1, ratePerBale: null },
    ];
    const purchase = generatePurchase(rng, company, items, DATE_RANGE, 1001);
    const products = JSON.parse(purchase.purchasedProducts);

    expect(purchase.companyId).toBe(7);
    expect(["PENDING", "APPROVED", "CANCEL"]).toContain(purchase.status);
    expect(["SMALL_BALES", "BIG_BALES"]).toContain(purchase.baleType);
    expect(purchase.purchaseDate.getTime()).toBeGreaterThanOrEqual(DATE_RANGE.start.getTime());
    expect(purchase.purchaseDate.getTime()).toBeLessThanOrEqual(DATE_RANGE.end.getTime());
    products.forEach((p) => expect([100, 101]).toContain(p.id));
    expect(purchase.totalAmount).toBeGreaterThan(0);
  });

  it("generates a sale whose soldProducts carry the source company id from inventory", () => {
    const rng = createRng(6);
    const customer = { id: 9 };
    const inventoryPool = [
      {
        id: 100,
        companyId: 7,
        itemName: "shoes mixed grade b",
        ratePerLbs: 0.9,
        ratePerKgs: null,
        ratePerBale: null,
        baleWeightLbs: 100,
        baleWeightKgs: null,
      },
      {
        id: 200,
        companyId: 8,
        itemName: "bath towels",
        ratePerLbs: null,
        ratePerKgs: 2.1,
        ratePerBale: null,
        baleWeightLbs: null,
        baleWeightKgs: 60,
      },
    ];
    const sale = generateSale(rng, customer, inventoryPool, DATE_RANGE);
    const products = JSON.parse(sale.soldProducts);

    expect(sale.customerId).toBe(9);
    expect(sale.soldProducts).not.toContain("undefined");
    products.forEach((p) => expect([7, 8]).toContain(p.companyId));
  });

  it("builds ledger rows only for approved purchases/sales plus synthetic payments, and pairs every CHEQUE payment with a cheque row", () => {
    const rng = createRng(7);
    const companies = [{ id: 1 }, { id: 2 }];
    const customers = [{ id: 10 }, { id: 11 }];
    const purchases = [
      {
        id: 1,
        companyId: 1,
        totalAmount: 500,
        status: "APPROVED",
        purchaseDate: new Date("2026-01-05"),
        invoiceNumber: "PINV-1",
      },
      {
        id: 2,
        companyId: 1,
        totalAmount: 300,
        status: "PENDING",
        purchaseDate: new Date("2026-01-10"),
        invoiceNumber: "PINV-2",
      },
      {
        id: 3,
        companyId: 2,
        totalAmount: 700,
        status: "CANCEL",
        purchaseDate: new Date("2026-01-12"),
        invoiceNumber: "PINV-3",
      },
    ];
    const sales = [
      { id: 1, customerId: 10, totalAmount: 200, status: "APPROVED", soldDate: new Date("2026-01-06") },
      { id: 2, customerId: 11, totalAmount: 150, status: "PENDING", soldDate: new Date("2026-01-11") },
    ];

    const { ledgerRows, chequeRows } = buildLedgerAndCheques(rng, { companies, customers, purchases, sales });

    const purchaseLedgerRows = ledgerRows.filter((row) => row.transactionId === 1 && row.companyId === 1);
    expect(purchaseLedgerRows).toHaveLength(1);
    expect(purchaseLedgerRows[0].spendType).toBe("DEBIT");

    const saleLedgerRows = ledgerRows.filter((row) => row.transactionId === 1 && row.customerId === 10);
    expect(saleLedgerRows).toHaveLength(1);
    expect(saleLedgerRows[0].spendType).toBe("CREDIT");

    // PENDING/CANCEL purchases and sales must never produce a transactionId-linked ledger row.
    expect(ledgerRows.some((row) => row.transactionId === 2 && row.companyId === 1)).toBe(false);
    expect(ledgerRows.some((row) => row.transactionId === 3)).toBe(false);
    expect(ledgerRows.some((row) => row.transactionId === 2 && row.customerId === 11)).toBe(false);

    const chequePaymentRows = ledgerRows.filter((row) => row.paymentType === "CHEQUE");
    expect(chequePaymentRows.length).toBe(chequeRows.length);
    chequePaymentRows.forEach((row) => {
      expect(chequeRows.some((cheque) => cheque.chequeId === row.reference)).toBe(true);
    });
    chequeRows.forEach((cheque) => {
      expect(["PENDING", "PASS", "RETURN", "CANCEL"]).toContain(cheque.status);
    });
  });
});
