import { computeEntryDelta } from "@/utils/ledger-balance.util";

const { findMismatches, legacyCustomerDelta, parseArgs } = require("../../scripts/repair-customer-ledger-balances");

const ORG = 7;
const CUSTOMER = 12;

// A role-based cash payment: customer pays a company (Pay By Customer / Pay To Company).
const cashFromCustomer = (id, amount) => ({
  id,
  organizationId: ORG,
  customerId: CUSTOMER,
  payByCustomerId: CUSTOMER,
  payToCompanyId: 3,
  paymentType: "CASH",
  spendType: "DEBIT",
  amount,
  customerTotal: null,
});

// A legacy customerId-only row, the shape /ledger/refund and sale returns create.
const legacyRow = (id, paymentType, amount, customerTotal, spendType = "CREDIT") => ({
  id,
  organizationId: ORG,
  customerId: CUSTOMER,
  paymentType,
  spendType,
  amount,
  customerTotal,
  paymentDate: "2026-11-02T00:00:00.000Z",
});

// A sale-created row: no paymentType, balance read from totalBalance, never repaired.
const saleRow = (id, amount) => ({
  id,
  organizationId: ORG,
  customerId: CUSTOMER,
  paymentType: null,
  spendType: "CREDIT",
  amount,
  customerTotal: null,
});

describe("repair-customer-ledger-balances", () => {
  it("uses the same direction rule as the app's computeEntryDelta", () => {
    for (const paymentType of ["REFUND", "INVENTORY_RETURN", "CASH", "ONLINE", "CHEQUE", null, ""]) {
      for (const spendType of ["CREDIT", "DEBIT"]) {
        expect([paymentType, spendType, legacyCustomerDelta(paymentType, spendType, 40)]).toEqual([
          paymentType,
          spendType,
          computeEntryDelta("customer", paymentType, spendType, 40),
        ]);
      }
    }
  });

  it("client scenario: corrects the refund row from -9,11,566.43 to -12,71,566.43", () => {
    const rows = [
      saleRow(1, 1091566.43 + 200000), // brings the balance to -12,91,566.43 before the payment
      cashFromCustomer(2, 200000), // -10,91,566.43
      legacyRow(3, "REFUND", 180000, -911566.43), // stored with the bug
    ];

    expect(findMismatches(rows)).toEqual([
      expect.objectContaining({
        organizationId: ORG,
        customerId: CUSTOMER,
        ledgerId: 3,
        paymentType: "REFUND",
        storedCustomerTotal: -911566.43,
        correctCustomerTotal: -1271566.43,
        difference: 360000,
        kind: "sign-bug",
      }),
    ]);
  });

  it("corrects a sale return that was subtracted instead of added", () => {
    const rows = [saleRow(1, 100), legacyRow(2, "INVENTORY_RETURN", 25, -125, "DEBIT")];

    expect(findMismatches(rows)).toEqual([
      expect.objectContaining({ ledgerId: 2, correctCustomerTotal: -75, difference: -50, kind: "sign-bug" }),
    ]);
  });

  it("leaves rows that already hold the right balance alone", () => {
    const rows = [
      saleRow(1, 100),
      legacyRow(2, "REFUND", 25, -125),
      legacyRow(3, "INVENTORY_RETURN", 25, -100, "DEBIT"),
    ];

    expect(findMismatches(rows)).toEqual([]);
  });

  it("flags a mismatch the sign bug doesn't explain as other drift", () => {
    const rows = [saleRow(1, 100), legacyRow(2, "REFUND", 25, -110)];

    expect(findMismatches(rows)).toEqual([
      expect.objectContaining({ ledgerId: 2, correctCustomerTotal: -125, kind: "other drift" }),
    ]);
  });

  it("only uses earlier rows (by id) for a row's balance", () => {
    const rows = [legacyRow(1, "REFUND", 25, 25), saleRow(2, 1000)];

    expect(findMismatches(rows)).toEqual([
      expect.objectContaining({ ledgerId: 1, correctCustomerTotal: -25, kind: "sign-bug" }),
    ]);
  });

  it("keeps customers separate", () => {
    const other = { ...legacyRow(2, "REFUND", 25, -25), customerId: 99 };
    const rows = [saleRow(1, 100), other];

    expect(findMismatches(rows)).toEqual([]);
  });

  it("is a dry run by default and only applies to one named row", () => {
    expect(parseArgs([])).toEqual({ apply: false, org: null, ledger: null });
    expect(parseArgs(["--org", "1", "--ledger", "18002", "--apply"])).toEqual({ apply: true, org: 1, ledger: 18002 });
    expect(() => parseArgs(["--apply"])).toThrow("--apply needs --ledger <id>");
    expect(() => parseArgs(["--org", "3", "--apply"])).toThrow("--apply needs --ledger <id>");
    expect(() => parseArgs(["--ledger", "abc"])).toThrow("--ledger needs a numeric id");
    expect(() => parseArgs(["--aply"])).toThrow("Unknown argument: --aply");
  });
});
