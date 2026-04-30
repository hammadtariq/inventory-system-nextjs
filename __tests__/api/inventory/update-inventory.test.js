import { createMocks } from "node-mocks-http";
import db from "@/lib/postgres";
import { updateInventory } from "@/pages/api/inventory/[id]";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres");

describe("updateInventory API", () => {
  let inventoryMock;

  beforeEach(() => {
    inventoryMock = {
      id: 101,
      itemName: "cotton roll",
      update: jest.fn(),
    };
    db.dbConnect = jest.fn();
    db.Inventory = {
      findOne: jest.fn(),
    };
  });

  it("should update inventory item successfully", async () => {
    db.Inventory.findOne.mockResolvedValue(inventoryMock);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: "101" },
      body: { itemName: "updated roll" },
    });

    await TenantContext.run(23, async () => updateInventory(req, res));

    expect(db.Inventory.findOne).toHaveBeenCalledWith({ where: { id: +req.query.id, organizationId: 23 } });
    expect(inventoryMock.update).toHaveBeenCalledWith({ itemName: "updated roll" });
    expect(res._getStatusCode()).toBe(200);
  });

  it("should return 404 if inventory item not found", async () => {
    db.Inventory.findOne.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: "101" },
      body: { itemName: "test" },
    });

    await TenantContext.run(23, async () => updateInventory(req, res));

    expect(res._getStatusCode()).toBe(404);
    expect(res._getData()).toEqual({ message: "inventory item not found" });
  });

  it("should return 400 if body is empty", async () => {
    db.Inventory.findOne.mockResolvedValue(inventoryMock);

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: "101" },
      body: {},
    });

    await TenantContext.run(23, async () => updateInventory(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({
      message: "No valid fields provided to update.",
      allowedFields: ["itemName"],
    });
  });

  it("should return 400 if Joi validation fails", async () => {
    const { req, res } = createMocks({
      method: "PUT",
      query: {},
      body: {},
    });

    await TenantContext.run(23, async () => updateInventory(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({ message: 'ValidationError: "id" is required' });
  });

  it("should return 500 on server error", async () => {
    db.Inventory.findOne.mockRejectedValue(new Error("DB crashed"));

    const { req, res } = createMocks({
      method: "PUT",
      query: { id: "101" },
      body: { itemName: "cotton" },
    });

    await TenantContext.run(23, async () => updateInventory(req, res));

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toEqual({ message: "Error: DB crashed" });
  });
});
