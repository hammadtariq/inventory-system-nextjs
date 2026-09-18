import db from "@/lib/postgres";
import { fetchInventoryData } from "@/pages/api/inventory/export";

jest.mock("@/lib/postgres", () => ({
  Inventory: {
    findAndCountAll: jest.fn(),
  },
  Company: {},
  sequelize: {
    query: jest.fn(),
  },
  Sequelize: {
    Op: {
      and: "and",
      gt: "gt",
    },
    QueryTypes: {
      SELECT: "SELECT",
    },
  },
}));

jest.mock("@/query/index", () => ({
  companyTotalBalesQuery: "SELECT total bales",
}));

describe("fetchInventoryData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.Inventory.findAndCountAll.mockResolvedValue({ count: 2, rows: [] });
    db.sequelize.query.mockResolvedValue([]);
  });

  it("excludes zero-stock rows from inventory exports and reports", async () => {
    await fetchInventoryData([], 9);

    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ organizationId: 9 }, { onHand: { gt: 0 } }],
        },
      })
    );
  });
});
