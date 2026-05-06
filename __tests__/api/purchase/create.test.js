// __tests__/api/purchase/create-purchase-order.test.js
import { createPurchaseOrder } from "@/pages/api/purchase/index";
import { createMocks } from "node-mocks-http";
import db from "@/lib/postgres";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Purchase: {
    create: jest.fn(),
  },
  Company: {
    findOne: jest.fn(),
  },
  Items: {
    findAll: jest.fn(),
  },
}));

describe("createPurchaseOrder API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a purchase order successfully", async () => {
    const newDate = new Date();
    db.Purchase.create.mockResolvedValue({}); // Simulate success
    db.Company.findOne.mockResolvedValue({ id: 1 });
    db.Items.findAll.mockResolvedValue([{ id: 101 }]);

    const { req, res } = createMocks({
      method: "POST",
      body: {
        companyId: 1,
        purchaseDate: newDate,
        baleType: "SMALL_BALES",
        totalAmount: 1000,
        purchasedProducts: [
          {
            id: 101,
            itemName: "Cotton Roll",
            noOfBales: 10,
            baleWeightLbs: 200,
            baleWeightKgs: 90.7,
            ratePerLbs: 2.5,
            ratePerKgs: 5.6,
            ratePerBale: 25,
          },
        ],
      },
    });

    await TenantContext.run(23, async () => createPurchaseOrder(req, res));

    expect(db.Purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...req.body,
        purchasedProducts: [
          expect.objectContaining({
            itemName: "cotton roll", // lowercased by Joi
          }),
        ],
        status: "PENDING",
        organizationId: 23,
      })
    );

    expect(res._getStatusCode()).toBe(200);
  });

  it("should return 400 if validation fails", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        companyId: 1,
      },
    });

    await TenantContext.run(23, async () => createPurchaseOrder(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toMatchObject({
      message: expect.stringContaining("ValidationError"),
    });
  });

  it("should return 400 if request body is empty", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {},
    });

    await TenantContext.run(23, async () => createPurchaseOrder(req, res));

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toMatchObject({
      message: expect.stringContaining("ValidationError"),
    });
  });

  it("should return 500 when DB throw error", async () => {
    db.Purchase.create.mockRejectedValue(new Error("DB crashed"));
    db.Company.findOne.mockResolvedValue({ id: 1 });
    db.Items.findAll.mockResolvedValue([{ id: 524 }]);

    const { req, res } = createMocks({
      method: "POST",
      body: {
        companyId: 1,
        baleType: "SMALL_BALES",
        purchaseDate: "2024-04-23",
        totalAmount: 1000,
        purchasedProducts: [
          {
            id: 524,
            itemName: "men tropical pant xl",
            noOfBales: 25,
            ratePerBale: 3000,
          },
        ],
      },
    });

    await TenantContext.run(23, async () => createPurchaseOrder(req, res));

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toEqual({ message: "Error: DB crashed" });
  });
});
