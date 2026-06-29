import { createMocks } from "node-mocks-http";
import { getPurchaseDistribution } from "@/pages/api/overview/purchase-distribution";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getPurchaseDistribution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValueOnce([{ total: "4000" }]).mockResolvedValueOnce([{ total: "6000" }]);
  });

  it("passes year to both queries and computes remaining correctly", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getPurchaseDistribution(req, res));

    expect(db.sequelize.query).toHaveBeenCalledTimes(2);
    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements).toMatchObject({ organizationId: 9, year: 2025 });
    });
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({ paid: 4000, remaining: 2000, total: 6000 });
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getPurchaseDistribution(req, res));

    db.sequelize.query.mock.calls.forEach(([, opts]) => {
      expect(opts.replacements.year).toBe(new Date().getFullYear());
    });
  });
});
