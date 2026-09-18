import { balanceQuery, resolveLedgerPartyFields } from "@/utils/query.utils";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { companySumQuery, customerSumQuery } from "@/query/index";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    sequelize: {
      query: jest.fn(),
    },
    Sequelize: {
      QueryTypes: {
        SELECT: "SELECT",
      },
    },
  },
}));

describe("balanceQuery tenant scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.sequelize.query.mockResolvedValue([{ amount: 100 }]);
  });

  it("uses replacements for company balance queries", async () => {
    const result = await TenantContext.run(23, async () => balanceQuery(7, "company"));

    expect(result).toEqual([{ amount: 100 }]);
    expect(db.sequelize.query).toHaveBeenCalledWith(companySumQuery, {
      type: "SELECT",
      replacements: { id: 7, organizationId: 23 },
    });
  });

  it("uses replacements for customer balance queries", async () => {
    await TenantContext.run(45, async () => balanceQuery(9, "customer"));

    expect(db.sequelize.query).toHaveBeenCalledWith(customerSumQuery, {
      type: "SELECT",
      replacements: { id: 9, organizationId: 45 },
    });
  });

  it("requires tenant context", async () => {
    await expect(balanceQuery(7, "company")).rejects.toThrow("TenantContext not set");
  });
});

describe("resolveLedgerPartyFields partyBalance", () => {
  it("shows a legitimately zero customerTotal instead of falling back to the unrelated totalBalance", () => {
    // A real row from prod-shaped data: customerTotal is genuinely 0 after this payment, but
    // totalBalance (a stale running total from a different row shape) is a large unrelated
    // number. `||` treats 0 as falsy and wrongly picks totalBalance; `??` must not.
    const row = { customerTotal: 0, totalBalance: 35913898.8964 };

    const { partyBalance } = resolveLedgerPartyFields(row, "customer", 153);

    expect(partyBalance).toBe(0);
  });

  it("shows a legitimately zero companyTotal instead of falling back to the unrelated totalBalance", () => {
    const row = { companyTotal: 0, totalBalance: 4065382.6044 };

    const { partyBalance } = resolveLedgerPartyFields(row, "company", 9);

    expect(partyBalance).toBe(0);
  });

  it("still falls back to totalBalance when companyTotal/customerTotal is genuinely absent (purchase/sale-created rows)", () => {
    const row = { customerTotal: null, totalBalance: -577800 };

    const { partyBalance } = resolveLedgerPartyFields(row, "customer", 153);

    expect(partyBalance).toBe(-577800);
  });
});

describe("resolveLedgerPartyFields displaySpendType", () => {
  it("keeps the row's own spendType for legacy (non-role) rows", () => {
    const row = { spendType: "DEBIT", companyTotal: -100, company: { companyName: "Acme" }, customer: null };

    const { displaySpendType } = resolveLedgerPartyFields(row, "company", 1);

    expect(displaySpendType).toBe("DEBIT");
  });

  it("displays CREDIT for a role-based company row when the viewed company is the Pay To side, even though the stored spendType is hardcoded to DEBIT", () => {
    // Manual "Create Transaction" payments always store spendType: DEBIT (pages/ledger/create.js) regardless
    // of actual direction — the real direction is which role (payTo/payBy) the viewed party plays.
    const row = {
      spendType: "DEBIT",
      payToCompanyId: 1,
      payToCustomerId: null,
      payByCompanyId: null,
      payByCustomerId: 5,
      payToTotal: -50,
      payByTotal: 50,
      payToCompany: { companyName: "Acme" },
      payByCustomer: { firstName: "John", lastName: "Doe" },
    };

    const { displaySpendType } = resolveLedgerPartyFields(row, "company", 1);

    expect(displaySpendType).toBe("CREDIT");
  });

  it("displays CREDIT for a legacy (pre-Pay-To/Pay-By) company row with a cash-like paymentType, even though the stored spendType is hardcoded to DEBIT", () => {
    // Legacy manual payments (companyId/customerId only, recorded before role columns existed)
    // also always store spendType: DEBIT via the same create.js form — paymentType is the only
    // signal distinguishing a manual payment (always a credit to the company) from a real
    // purchase-created row (paymentType blank, spendType already correct).
    const row = {
      spendType: "DEBIT",
      paymentType: "CASH",
      companyId: 9,
      customerId: 132,
      companyTotal: 209030.6,
      company: { companyName: "Star Pvt Ltd" },
      customer: { firstName: "Ahmed", lastName: "Khan" },
    };

    const { displaySpendType } = resolveLedgerPartyFields(row, "company", 9);

    expect(displaySpendType).toBe("CREDIT");
  });

  it("keeps DEBIT for a legacy purchase-created company row (blank paymentType, no companyTotal)", () => {
    const row = {
      spendType: "DEBIT",
      paymentType: null,
      companyId: 9,
      totalBalance: 1268045.6,
      company: { companyName: "Star Pvt Ltd" },
    };

    const { displaySpendType } = resolveLedgerPartyFields(row, "company", 9);

    expect(displaySpendType).toBe("DEBIT");
  });

  it("displays DEBIT for a role-based company row when the viewed company is the Pay By side", () => {
    const row = {
      spendType: "DEBIT",
      payToCompanyId: 2,
      payToCustomerId: null,
      payByCompanyId: 1,
      payByCustomerId: null,
      payToTotal: -50,
      payByTotal: 50,
      payToCompany: { companyName: "Vendor B" },
      payByCompany: { companyName: "Acme" },
    };

    const { displaySpendType } = resolveLedgerPartyFields(row, "company", 1);

    expect(displaySpendType).toBe("DEBIT");
  });
});
