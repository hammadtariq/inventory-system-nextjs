import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getPurchaseReport } from "@/pages/api/report";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Inventory: {
    findAll: jest.fn(),
  },
  Company: {},
}));

describe("getPurchaseReport API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("includes zero-stock inventory rows in stock reports", async () => {
    db.Inventory.findAll.mockResolvedValue([
      {
        companyId: 1,
        onHand: 0,
        company: { companyName: "Supplier A" },
      },
    ]);

    const { req, res } = createMocks({ method: "GET" });

    await TenantContext.run(9, async () => getPurchaseReport(req, res));

    expect(db.Inventory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 9 },
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      content: [
        {
          company: "Supplier A",
          onHand: 0,
          companyId: 1,
          totalAmount: 0,
        },
      ],
      total: {
        totalBales: 0,
        totalCost: 0,
      },
    });
  });
});
