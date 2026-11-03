// Reproduces the client-reported refund bug (customer ledger 12, 2026-11-02 screenshot):
// an AMOUNT REFUND of 1,80,000 on a balance of -10,91,566.43 was stored with a row balance of
// -9,11,566.43, while the page's Total Balance (customerSumQuery) showed -12,71,566.43.
//
// The live total treats REFUND as -amount and INVENTORY_RETURN / cash as +amount
// (query/index.js customerSumQuery, utils/ledger-balance.util.js computeEntryDelta). The stored
// per-row customerTotal written by createLedgerPayment must follow the same direction.
import { createLedgerPayment } from "@/lib/ledger";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { balanceQuery } from "@/utils/query.utils";
import { computeEntryDelta } from "@/utils/ledger-balance.util";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    Ledger: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/utils/query.utils", () => ({
  balanceQuery: jest.fn(),
}));

const savedRow = () => db.Ledger.create.mock.calls[0][0];

const createCustomerOnlyEntry = (fields) =>
  TenantContext.run(77, () =>
    createLedgerPayment({ customerId: 12, paymentDate: "2026-11-02", reference: "", ...fields })
  );

describe("createLedgerPayment: direction of customer refunds and returns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.Ledger.create.mockResolvedValue({ id: 1 });
  });

  it("client scenario: refund of 1,80,000 on -10,91,566.43 is stored as -12,71,566.43", async () => {
    balanceQuery.mockResolvedValue([{ amount: -1091566.43 }]);

    await createCustomerOnlyEntry({ totalAmount: 180000, spendType: "CREDIT", paymentType: "REFUND" });

    expect(savedRow().customerTotal).toBeCloseTo(-1271566.43, 2);
  });

  it("a refund reduces the customer's balance (100 - 25 = 75)", async () => {
    balanceQuery.mockResolvedValue([{ amount: 100 }]);

    await createCustomerOnlyEntry({ totalAmount: 25, spendType: "CREDIT", paymentType: "REFUND" });

    expect(savedRow().customerTotal).toBe(75);
  });

  it("a customer's first-ever entry being a refund is stored as a negative balance", async () => {
    balanceQuery.mockResolvedValue([]);

    await createCustomerOnlyEntry({ totalAmount: 25, spendType: "CREDIT", paymentType: "REFUND" });

    expect(savedRow().customerTotal).toBe(-25);
  });

  it("an inventory (sale) return increases the customer's balance (100 + 25 = 125)", async () => {
    balanceQuery.mockResolvedValue([{ amount: 100 }]);

    await createCustomerOnlyEntry({ totalAmount: 25, spendType: "DEBIT", paymentType: "INVENTORY_RETURN" });

    expect(savedRow().customerTotal).toBe(125);
  });

  it("the stored row balance equals what the live total becomes after the entry", async () => {
    // computeEntryDelta is what the page's running balance uses; its parity with
    // customerSumQuery is checked in __tests__/utils/ledger-balance.util.test.js.
    const prior = -1091566.43;

    for (const paymentType of ["REFUND", "INVENTORY_RETURN", "CASH", "ONLINE", "CHEQUE"]) {
      jest.clearAllMocks();
      balanceQuery.mockResolvedValue([{ amount: prior }]);
      const spendType = paymentType === "REFUND" ? "CREDIT" : "DEBIT";

      await createCustomerOnlyEntry({ totalAmount: 180000, spendType, paymentType });

      expect({ paymentType, customerTotal: savedRow().customerTotal }).toEqual({
        paymentType,
        customerTotal: expect.closeTo(prior + computeEntryDelta("customer", paymentType, spendType, 180000), 2),
      });
    }
  });
});
