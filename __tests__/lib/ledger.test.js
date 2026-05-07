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
});
