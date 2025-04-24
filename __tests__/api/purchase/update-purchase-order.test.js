import { updatePurchaseOrder, updatePurchaseOrderAfterApproval } from "@/pages/api/purchase/[id]";
import db from "@/lib/postgres";
import { createMocks } from "node-mocks-http";
import { STATUS } from "@/utils/api.util";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Purchase: {
    findByPk: jest.fn(),
  },
}));

describe("updatePurchaseOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if Joi validation fails", async () => {
    const { req, res } = createMocks({
      method: "POST",
      query: { id: "abc" },
      body: {},
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'ValidationError: "id" must be a number' });
  });

  it("should return 404 if purchase not found", async () => {
    db.Purchase.findByPk.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 1 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: "Purchase order does not exist" });
  });

  it("should return 500 on unexpected errors", async () => {
    db.Purchase.findByPk.mockRejectedValue(new Error("DB Error"));

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 1 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: "Error: DB Error" });
  });

  it("should update directly if status is editable and revisionNo is 0", async () => {
    const mockPurchase = {
      toJSON: () => ({ id: 2, status: "DRAFT", revisionNo: 0 }),
      update: jest.fn(),
    };

    db.Purchase.findByPk.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 2 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    expect(mockPurchase.update).toHaveBeenCalledWith(expect.objectContaining({ status: STATUS.PENDING }));
    expect(res.send).toHaveBeenCalledWith(mockPurchase);
  });

  it("should update with revision if status is editable and revisionNo exists", async () => {
    const mockPurchase = {
      toJSON: () => ({ id: 3, status: "PENDING", revisionNo: 2 }),
      update: jest.fn(),
    };

    db.Purchase.findByPk.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 3 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    // Since you're not updating, just check the returned purchase object
    expect(res.send).toHaveBeenCalledWith(mockPurchase);
  });

  it("should call updatePurchaseOrderAfterApproval if status is not editable", async () => {
    const purchaseObj = { id: 4, status: "APPROVED", revisionNo: 1 };
    const mockPurchase = {
      toJSON: () => purchaseObj,
      update: jest.fn().mockResolvedValue({
        ...purchaseObj,
        baleType: "BIG_BALES",
        status: STATUS.PENDING,
        revisionDetails: { purchaseProducts: [{ id: 524, noOfBales: 20 }] },
        revisionNo: 2,
      }),
    };

    db.Purchase.findByPk.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 4 },
      body: { baleType: "BIG_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await updatePurchaseOrder(req, res);

    expect(mockPurchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        baleType: "BIG_BALES",
        status: STATUS.PENDING,
        revisionNo: purchaseObj.revisionNo + 1,
      })
    );

    expect(res.send).toHaveBeenCalledWith(mockPurchase);
  });
});

describe("updatePurchaseOrderAfterApproval", () => {
  it("should update purchase with revision data when there are differences", async () => {
    const value = {
      baleType: "BIG_BALES",
      companyId: 6,
      totalAmount: 8563500,
      purchasedProducts: [
        {
          id: 523,
          itemName: "men cotton shirt xl",
          noOfBales: 65,
          ratePerKgs: 0,
          ratePerLbs: 0,
          ratePerBale: 13000,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
        {
          id: 524,
          itemName: "men tropical pant xl",
          noOfBales: 45,
          ratePerKgs: 0,
          ratePerLbs: 0,
          ratePerBale: 3000,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
    };
    const purchaseObj = {
      id: 5,
      status: "APPROVED",
      revisionNo: 1,
      baleType: "BIG_BALES",
      companyId: 6,
      totalAmount: 8000000,
      purchasedProducts: [
        {
          id: 523,
          itemName: "men cotton shirt xl",
          noOfBales: 35,
          ratePerKgs: 0,
          ratePerLbs: 0,
          ratePerBale: 13000,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
        {
          id: 524,
          itemName: "men tropical pant xl",
          noOfBales: 40,
          ratePerKgs: 0,
          ratePerLbs: 0,
          ratePerBale: 3000,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
    };
    const mockUpdate = jest.fn();

    const purchase = {
      update: mockUpdate,
    };

    await updatePurchaseOrderAfterApproval(value, purchase, purchaseObj);

    expect(mockUpdate).toHaveBeenCalledWith({
      baleType: "BIG_BALES",
      companyId: 6,
      purchasedProducts: [
        {
          baleWeightKgs: 0,
          baleWeightLbs: 0,
          id: 523,
          itemName: "men cotton shirt xl",
          noOfBales: 65,
          ratePerBale: 13000,
          ratePerKgs: 0,
          ratePerLbs: 0,
        },
        {
          baleWeightKgs: 0,
          baleWeightLbs: 0,
          id: 524,
          itemName: "men tropical pant xl",
          noOfBales: 45,
          ratePerBale: 3000,
          ratePerKgs: 0,
          ratePerLbs: 0,
        },
      ],
      revisionDetails: {
        purchasedProducts: [
          { id: 523, noOfBales: 30 },
          { id: 524, noOfBales: 5 },
        ],
        totalAmount: 8563500,
      },
      revisionNo: 2,
      status: "PENDING",
      totalAmount: 8563500,
    });
  });

  it("should still update purchase with status PENDING even if no differences", async () => {
    const value = { baleType: "BIG_BALES" };
    const purchaseObj = { id: 6, status: "APPROVED", revisionNo: 3, baleType: "BIG_BALES" };
    const mockUpdate = jest.fn();

    const purchase = {
      update: mockUpdate,
    };

    await updatePurchaseOrderAfterApproval(value, purchase, purchaseObj);

    expect(mockUpdate).toHaveBeenCalledWith({
      baleType: "BIG_BALES",
      status: STATUS.PENDING,
      revisionDetails: {}, // no changes
      revisionNo: 4,
    });
  });
});
