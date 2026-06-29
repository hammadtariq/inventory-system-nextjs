import { createMocks } from "node-mocks-http";
import { getSalesVsPurchases } from "@/pages/api/overview/sales-vs-purchases";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

const emptyMonths = Array.from({ length: 12 }, (_, i) => ({ month: "Jan", month_num: i + 1, total: "0" }));

describe("getSalesVsPurchases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue(emptyMonths);
  });

  it("uses the year from query param", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getSalesVsPurchases(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: 2025, organizationId: 9 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveProperty("salesData");
    expect(res._getData()).toHaveProperty("purchasesData");
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getSalesVsPurchases(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
