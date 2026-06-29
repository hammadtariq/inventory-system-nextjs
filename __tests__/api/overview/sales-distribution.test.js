import { createMocks } from "node-mocks-http";
import { getSalesDistribution } from "@/pages/api/overview/sales-distribution";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getSalesDistribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query
      .mockResolvedValueOnce([{ total: "8000" }])
      .mockResolvedValueOnce([{ total: "2000" }])
      .mockResolvedValueOnce([{ total: "500" }]);
  });

  it("passes year to all three queries", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2023" } });

    await TenantContext.run(9, async () => getSalesDistribution(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(3);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2023 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({ paid: 8000, due: 2000, return: 500 });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getSalesDistribution(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
