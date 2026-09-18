import { createMocks } from "node-mocks-http";
import { getCards } from "@/pages/api/overview/cards";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query
      .mockResolvedValueOnce([{ total: "5000" }])
      .mockResolvedValueOnce([{ total: "3000" }])
      .mockResolvedValueOnce([{ total: "200" }])
      .mockResolvedValueOnce([{ total: "-100" }]);
  });

  it("passes year to all queries", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2024" } });

    await TenantContext.run(9, async () => getCards(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(4);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2024 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      totalSales: 5000,
      totalPurchases: 3000,
      totalSaleDue: 200,
      totalPurchaseDue: -100,
    });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getCards(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
