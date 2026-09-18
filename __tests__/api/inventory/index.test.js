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
  Sequelize: {
    Op: {
      gt: "gt",
      in: "in",
      eq: "eq",
    },
  },
}));

describe("getAllInventory API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides zero-stock inventory rows for operational inventory listing", async () => {
    db.Inventory.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 2, itemName: "item b", onHand: 5 }],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {},
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllInventory(req, res));

    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 9,
          onHand: { gt: 0 },
        },
      })
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual({
      count: 1,
      rows: [{ id: 2, itemName: "item b", onHand: 5 }],
    });
  });

  it("does not apply a default limit when attributes are requested without pagination", async () => {
    db.Inventory.findAndCountAll.mockResolvedValue({
      count: 1001,
      rows: [],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {
        attributes: JSON.stringify(["itemName", "id", "onHand", "companyId"]),
      },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllInventory(req, res));

    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.not.objectContaining({
        limit: expect.anything(),
      })
    );
    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.not.objectContaining({
        offset: expect.anything(),
      })
    );
    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          onHand: { gt: 0 },
        }),
      })
    );
    expect(res._getStatusCode()).toBe(200);
  });

  it("applies pagination when limit and offset are explicitly requested", async () => {
    db.Inventory.findAndCountAll.mockResolvedValue({
      count: 20,
      rows: [],
    });

    const { req, res } = createMocks({
      method: "GET",
      query: {
        limit: "10",
        offset: "10",
      },
    });
    req.user = { role: "ADMIN" };

    await TenantContext.run(9, async () => getAllInventory(req, res));

    expect(db.Inventory.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 10,
      })
    );
    expect(res._getStatusCode()).toBe(200);
  });
});
