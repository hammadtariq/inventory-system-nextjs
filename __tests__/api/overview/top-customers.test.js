import { createMocks } from "node-mocks-http";
import { getTopCustomers } from "@/pages/api/overview/top-customers";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: { query: jest.fn() },
  Sequelize: { QueryTypes: { SELECT: "SELECT" } },
}));

describe("getTopCustomers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.query.mockResolvedValue([{ name: "Alice Smith", id: 1, total: "50000", salesTransactions: 5 }]);
  });

  it("passes year to query and returns results", async () => {
    const { req, res } = createMocks({ method: "GET", query: { year: "2025" } });

    await TenantContext.run(9, async () => getTopCustomers(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ organizationId: 9, year: 2025 }) })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toHaveLength(1);
  });

  it("falls back to current year when no year param", async () => {
    const { req, res } = createMocks({ method: "GET", query: {} });

    await TenantContext.run(9, async () => getTopCustomers(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replacements: expect.objectContaining({ year: new Date().getFullYear() }) })
    );
  });
});
