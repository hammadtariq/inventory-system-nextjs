import { updatePurchaseOrder, updatePurchaseOrderAfterApproval } from "@/pages/api/purchase/[id]";
import db from "@/lib/postgres";
import { createMocks } from "node-mocks-http";
import { STATUS } from "@/utils/api.util";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn(),
  Purchase: {
    findOne: jest.fn(),
  },
  Company: {
    findOne: jest.fn(),
  },
  Items: { findAll: jest.fn() },
  PurchaseHistory: {
    create: jest.fn().mockResolvedValue({}), // mock it so it doesn't throw
  },
}));

describe("updatePurchaseOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an unowned product without changing a pending purchase", async () => {
    const original = { id: 1, companyId: 6, status: "PENDING", revisionNo: 0 };
    const purchase = { ...original, toJSON: () => original, update: jest.fn() };
    db.Purchase.findOne.mockResolvedValue(purchase);
    db.Items.findAll.mockResolvedValue([]);
    const { req, res } = createMocks({
      method: "PUT",
      query: { id: 1 },
      body: { purchasedProducts: [{ id: 999999 }] },
    });
    await TenantContext.run(23, () => updatePurchaseOrder(req, res));
    expect(res._getStatusCode()).toBe(404);
    expect(purchase.update).not.toHaveBeenCalled();
    expect(db.PurchaseHistory.create).not.toHaveBeenCalled();
  });

  describe.each(["PENDING", "APPROVED"])("%s product ownership", (status) => {
    it.each([
      ["another organization", { id: 20, organizationId: 99, companyId: 6 }],
      ["another company", { id: 20, organizationId: 23, companyId: 7 }],
      ["missing item", null],
    ])("rejects mixed valid and %s products without any writes", async (_, invalidItem) => {
      const original = { id: 1, companyId: 6, status, revisionNo: 0, purchasedProducts: [{ id: 10 }] };
      const purchase = { ...original, toJSON: () => original, update: jest.fn() };
      db.Purchase.findOne.mockResolvedValue(purchase);
      const items = [{ id: 10, organizationId: 23, companyId: 6 }, invalidItem].filter(Boolean);
      db.Items.findAll.mockImplementation(async ({ where }) =>
        items.filter(
          (item) =>
            where.id.includes(item.id) &&
            item.companyId === where.companyId &&
            item.organizationId === where.organizationId
        )
      );
      const { req, res } = createMocks({
        method: "PUT",
        query: { id: 1 },
        body: { purchasedProducts: [{ id: 10 }, { id: 20 }] },
      });
      await TenantContext.run(23, () => updatePurchaseOrder(req, res));
      expect(res._getStatusCode()).toBe(404);
      expect(purchase.update).not.toHaveBeenCalled();
      expect(db.PurchaseHistory.create).not.toHaveBeenCalled();
    });

    it.each([undefined, 7])("accepts duplicate owned products for effective company %s", async (companyId) => {
      const original = { id: 1, companyId: 6, status, revisionNo: 0, purchasedProducts: [] };
      const purchase = { ...original, toJSON: () => original, update: jest.fn().mockResolvedValue({}) };
      db.Purchase.findOne.mockResolvedValue(purchase);
      db.Company.findOne.mockResolvedValue({ id: 7 });
      const item = { id: 10, organizationId: 23, companyId: companyId ?? 6 };
      db.Items.findAll.mockImplementation(async ({ where }) =>
        where.id.includes(item.id) && where.companyId === item.companyId && where.organizationId === item.organizationId
          ? [item]
          : []
      );
      const products = [
        { id: 10, noOfBales: 2 },
        { id: 10, noOfBales: 3 },
      ];
      const { req, res } = createMocks({
        method: "PUT",
        query: { id: 1 },
        body: { purchasedProducts: products, ...(companyId ? { companyId } : {}) },
      });
      await TenantContext.run(23, () => updatePurchaseOrder(req, res));
      expect(res._getStatusCode()).toBe(200);
      expect(purchase.update).toHaveBeenCalledWith(expect.objectContaining({ purchasedProducts: products }));
    });
  });

  it("should return 400 if Joi validation fails", async () => {
    const { req, res } = createMocks({
      method: "POST",
      query: { id: "abc" },
      body: {},
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'ValidationError: "id" must be a number' });
  });

  it("should return 404 if purchase not found", async () => {
    db.Purchase.findOne.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 1 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: "Purchase order does not exist" });
  });

  it("should return 500 on unexpected errors", async () => {
    db.Purchase.findOne.mockRejectedValue(new Error("DB Error"));

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 1 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ message: "Error: DB Error" });
  });

  it("should update directly if status is editable and revisionNo is 0", async () => {
    const mockPurchase = {
      toJSON: () => ({ id: 2, status: "DRAFT", revisionNo: 0 }),
      update: jest.fn(),
    };

    db.Purchase.findOne.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 2 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

    expect(mockPurchase.update).toHaveBeenCalledWith(expect.objectContaining({ status: STATUS.PENDING }));
    expect(res.send).toHaveBeenCalledWith(mockPurchase);
  });

  it("should update with revision if status is editable and revisionNo exists", async () => {
    const mockPurchase = {
      toJSON: () => ({ id: 3, status: "PENDING", revisionNo: 2 }),
      update: jest.fn(),
    };

    db.Purchase.findOne.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 3 },
      body: { baleType: "SMALL_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

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

    db.Purchase.findOne.mockResolvedValue(mockPurchase);

    const { req, res } = createMocks({
      method: "POST",
      query: { id: 4 },
      body: { baleType: "BIG_BALES" },
    });

    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();

    await TenantContext.run(23, async () => updatePurchaseOrder(req, res));

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
    db.PurchaseHistory = {
      create: jest.fn().mockResolvedValue({ id: 1 }), // you can customize the return as needed
    };
    const value = {
      id: 5,
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

    const clonePurchase = { ...purchaseObj }; // simulate a cloned version of purchaseObj
    const newRevisionNo = (purchaseObj.revisionNo || 0) + 1;

    await updatePurchaseOrderAfterApproval(value, purchase, purchaseObj, clonePurchase, newRevisionNo);

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 5, // Add the id of the purchase object
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
        previousPurchasedProducts: [
          {
            baleWeightKgs: 0,
            baleWeightLbs: 0,
            id: 523,
            itemName: "men cotton shirt xl",
            noOfBales: 35, // Previous value for noOfBales
            ratePerBale: 13000,
            ratePerKgs: 0,
            ratePerLbs: 0,
          },
          {
            baleWeightKgs: 0,
            baleWeightLbs: 0,
            id: 524,
            itemName: "men tropical pant xl",
            noOfBales: 40, // Previous value for noOfBales
            ratePerBale: 3000,
            ratePerKgs: 0,
            ratePerLbs: 0,
          },
        ],
        purchasedProducts: [
          { id: 523, noOfBales: 30 },
          { id: 524, noOfBales: 5 },
        ],
        totalAmount: 8563500, // Total updated amount
      },
      revisionNo: 2, // The new revision number
      status: "PENDING", // Status changed to "PENDING"
      totalAmount: 8563500, // Updated total amount
    });
    expect(db.PurchaseHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baleType: "BIG_BALES",
        companyId: 6,
        createdAt: expect.any(Date),
        id: 5,
        purchaseId: undefined,
        purchasedProducts: [
          {
            baleWeightKgs: 0,
            baleWeightLbs: 0,
            id: 523,
            itemName: "men cotton shirt xl",
            noOfBales: 35,
            ratePerBale: 13000,
            ratePerKgs: 0,
            ratePerLbs: 0,
          },
          {
            baleWeightKgs: 0,
            baleWeightLbs: 0,
            id: 524,
            itemName: "men tropical pant xl",
            noOfBales: 40,
            ratePerBale: 3000,
            ratePerKgs: 0,
            ratePerLbs: 0,
          },
        ],
        revisionDetails: {
          previousPurchasedProducts: [
            {
              baleWeightKgs: 0,
              baleWeightLbs: 0,
              id: 523,
              itemName: "men cotton shirt xl",
              noOfBales: 35,
              ratePerBale: 13000,
              ratePerKgs: 0,
              ratePerLbs: 0,
            },
            {
              baleWeightKgs: 0,
              baleWeightLbs: 0,
              id: 524,
              itemName: "men tropical pant xl",
              noOfBales: 40,
              ratePerBale: 3000,
              ratePerKgs: 0,
              ratePerLbs: 0,
            },
          ],
          purchasedProducts: [
            { id: 523, noOfBales: 30 },
            { id: 524, noOfBales: 5 },
          ],
          totalAmount: 8563500,
        },
        revisionNo: 2,
        status: "APPROVED",
        totalAmount: 8000000,
      })
    );
  });

  it("should still update purchase with status PENDING even if no differences", async () => {
    const value = { baleType: "BIG_BALES" };
    const purchaseObj = { id: 6, status: "APPROVED", revisionNo: 3, baleType: "BIG_BALES" };
    const mockUpdate = jest.fn();

    const purchase = {
      update: mockUpdate,
    };

    const clonePurchase = { ...purchaseObj };
    const newRevisionNo = (purchaseObj.revisionNo || 0) + 1;
    await updatePurchaseOrderAfterApproval(value, purchase, purchaseObj, clonePurchase, newRevisionNo);

    expect(mockUpdate).toHaveBeenCalledWith({
      baleType: "BIG_BALES",
      status: STATUS.PENDING,
      revisionDetails: {}, // no changes
      revisionNo: 4,
      revisionDetails: {
        previousPurchasedProducts: undefined,
      },
    });
  });
});
