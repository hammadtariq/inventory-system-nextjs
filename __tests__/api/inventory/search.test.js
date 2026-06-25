import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { searchInventory } from "@/pages/api/inventory/search";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Inventory: {
    findAll: jest.fn(),
  },
  Company: {},
  Sequelize: {
    Op: {
      gt: "gt",
      or: "or",
      like: "like",
    },
  },
}));

describe("searchInventory API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides zero-stock rows for operational inventory search", async () => {
    db.Inventory.findAll.mockResolvedValue([{ id: 2, itemName: "item b", onHand: 5 }]);

    const { req, res } = createMocks({
      method: "GET",
      query: { value: "item" },
    });

    await TenantContext.run(9, async () => searchInventory(req, res));

    expect(db.Inventory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 9,
          onHand: { gt: 0 },
          or: [{ itemName: { like: "%item%" } }],
        },
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual([{ id: 2, itemName: "item b", onHand: 5 }]);
  });
});
