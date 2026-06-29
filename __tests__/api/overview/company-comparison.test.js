import { createMocks } from "node-mocks-http";
import { getCompanyComparison } from "@/pages/api/overview/company-comparison";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getCompanyComparison", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue([
      { name: "Acme Co", total: "15000" },
      { name: "Beta Ltd", total: "8000" },
    ]);
  });

  it("passes year to query and returns results", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2026" } });

    await TenantContext.run(9, async () => getCompanyComparison(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ organizationId: 9, year: 2026 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveLength(2);
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getCompanyComparison(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
