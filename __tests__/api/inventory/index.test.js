import { createMocks } from "node-mocks-http";

import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";
import { getAllInventory } from "@/pages/api/inventory/index";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Inventory: {
    findAndCountAll: jest.fn(),
  },
  Company: {},
}));

describe("getAllInventory API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not hide zero-stock inventory rows at the API level", async () => {
    db.Inventory.findAndCountAll.mockResolvedValue({
      count: 2,
      rows: [
        { id: 1, itemName: "item a", onHand: 0 },
        { id: 2, itemName: "item b", onHand: 5 },
      ],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllInventory(req, res));

    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 9 },
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      count: 2,
      rows: [
        { id: 1, itemName: "item a", onHand: 0 },
        { id: 2, itemName: "item b", onHand: 5 },
      ],
    });
  });
});
