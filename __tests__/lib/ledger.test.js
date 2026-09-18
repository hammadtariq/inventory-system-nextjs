import { createLedgerPayment } from "@/lib/ledger";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { balanceQuery } from "@/utils/query.utils";

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

describe("createLedgerPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.Ledger.create.mockResolvedValue({ id: 1 });
    balanceQuery.mockResolvedValue([{ amount: 100 }]);
  });

  it("stamps organizationId from tenant context on customer refunds", async () => {
    await TenantContext.run(77, async () =>
      createLedgerPayment({
        customerId: 5,
        totalAmount: 25,
        spendType: "CREDIT",
        paymentType: "REFUND",
        paymentDate: "2026-05-01",
      })
    );

    expect(balanceQuery).toHaveBeenCalledWith(5, "customer", undefined);
    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 5,
        amount: 25,
        customerTotal: 125,
        organizationId: 77,
      }),
      undefined
    );
  });

  it("requires tenant context before creating a ledger row", async () => {
    await expect(
      createLedgerPayment({
        totalAmount: 25,
        spendType: "DEBIT",
        paymentType: "CASH",
        paymentDate: "2026-05-01",
      })
    ).rejects.toThrow("TenantContext not set");
  });

  it("fills legacy columns and payTo/payBy totals for Pay To Company / Pay By Customer", async () => {
    balanceQuery.mockImplementation((id, type) =>
      Promise.resolve(type === "company" ? [{ amount: 500 }] : [{ amount: 200 }])
    );

    await TenantContext.run(77, async () =>
      createLedgerPayment({
        payToCompanyId: 1,
        payByCustomerId: 5,
        totalAmount: 25,
        spendType: "DEBIT",
        paymentType: "CASH",
        paymentDate: "2026-05-01",
      })
    );

    expect(balanceQuery).toHaveBeenCalledWith(1, "company", undefined);
    expect(balanceQuery).toHaveBeenCalledWith(5, "customer", undefined);
    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 1,
        customerId: 5,
        companyTotal: 475,
        customerTotal: 175,
        totalBalance: 475,
        payToCompanyId: 1,
        payToCustomerId: null,
        payByCompanyId: null,
        payByCustomerId: 5,
        payToTotal: 475,
        payByTotal: 225,
      }),
      undefined
    );
  });

  it("supports Pay To Customer / Pay By Company without touching legacy columns", async () => {
    balanceQuery.mockImplementation((id, type) =>
      Promise.resolve(type === "customer" ? [{ amount: 100 }] : [{ amount: 300 }])
    );

    await TenantContext.run(77, async () =>
      createLedgerPayment({
        payToCustomerId: 5,
        payByCompanyId: 1,
        totalAmount: 25,
        spendType: "DEBIT",
        paymentType: "CASH",
        paymentDate: "2026-05-01",
      })
    );

    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payToCustomerId: 5,
        payByCompanyId: 1,
        payToTotal: 75,
        payByTotal: 325,
      }),
      undefined
    );

    const [savedData] = db.Ledger.create.mock.calls[0];
    expect(savedData.companyId).toBeUndefined();
    expect(savedData.customerId).toBeUndefined();
    expect(savedData.companyTotal).toBeUndefined();
    expect(savedData.customerTotal).toBeUndefined();
  });

  it("supports Pay To Company / Pay By Company between different companies", async () => {
    balanceQuery.mockImplementation((id) => Promise.resolve(id === 1 ? [{ amount: 500 }] : [{ amount: 300 }]));

    await TenantContext.run(77, async () =>
      createLedgerPayment({
        payToCompanyId: 1,
        payByCompanyId: 2,
        totalAmount: 25,
        spendType: "DEBIT",
        paymentType: "CASH",
        paymentDate: "2026-05-01",
      })
    );

    expect(balanceQuery).toHaveBeenCalledWith(1, "company", undefined);
    expect(balanceQuery).toHaveBeenCalledWith(2, "company", undefined);
    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payToCompanyId: 1,
        payByCompanyId: 2,
        payToTotal: 475,
        payByTotal: 325,
      }),
      undefined
    );
  });

  it("supports Pay To Customer / Pay By Customer between different customers, seeding balance at 0 when there is no prior history", async () => {
    balanceQuery.mockResolvedValue([]);

    await TenantContext.run(77, async () =>
      createLedgerPayment({
        payToCustomerId: 5,
        payByCustomerId: 6,
        totalAmount: 25,
        spendType: "DEBIT",
        paymentType: "CASH",
        paymentDate: "2026-05-01",
      })
    );

    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payToCustomerId: 5,
        payByCustomerId: 6,
        payToTotal: -25,
        payByTotal: 25,
      }),
      undefined
    );
  });
});
