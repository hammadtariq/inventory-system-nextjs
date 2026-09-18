import { createMocks } from "node-mocks-http";
import { getAvailableYears } from "@/pages/api/overview/available-years";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  sequelize: {
    query: jest.fn(),
  },
  Sequelize: {
    QueryTypes: { SELECT: "SELECT" },
  },
}));

describe("getAvailableYears", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.dbConnect.mockResolvedValue();
  });

  it("returns sorted years from sales and purchases", async () => {
    db.sequelize.query.mockResolvedValue([{ year: 2026 }, { year: 2025 }, { year: 2024 }]);

    const { req, res } = createMocks({ method: "GET" });

    await TenantContext.run(9, async () => getAvailableYears(req, res));

    expect(db.sequelize.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        replacements: expect.objectContaining({ organizationId: 9 }),
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual([2026, 2025, 2024]);
  });

  it("returns 500 on db error", async () => {
    db.sequelize.query.mockRejectedValue(new Error("db error"));
    const { req, res } = createMocks({ method: "GET" });

    await TenantContext.run(9, async () => getAvailableYears(req, res));

    expect(res._getStatusCode()).toBe(500);
  });
});
