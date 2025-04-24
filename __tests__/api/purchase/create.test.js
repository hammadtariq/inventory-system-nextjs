// __tests__/api/purchase/create-purchase-order.test.js
import { createPurchaseOrder } from "@/pages/api/purchase/index";
import { createMocks } from "node-mocks-http";
import db from "@/lib/postgres";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Purchase: {
    create: jest.fn(),
  },
}));

describe("createPurchaseOrder API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a purchase order successfully", async () => {
    const newDate = new Date();
    db.Purchase.create.mockResolvedValue({}); // Simulate success

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

    await createPurchaseOrder(req, res);

    expect(db.Purchase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...req.body,
        purchasedProducts: [
          expect.objectContaining({
            itemName: "cotton roll", // lowercased by Joi
          }),
        ],
        status: "PENDING",
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

    await createPurchaseOrder(req, res);

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

    await createPurchaseOrder(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toMatchObject({
      message: expect.stringContaining("ValidationError"),
    });
  });

  it("should return 500 when DB throw error", async () => {
    db.Purchase.create.mockRejectedValue(new Error("DB crashed"));

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

    await createPurchaseOrder(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toEqual({ message: "Error: DB crashed" });
  });
});
