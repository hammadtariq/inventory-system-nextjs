jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn().mockResolvedValue(),
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  },
  Company: {},
  Purchase: {
    findByPk: jest.fn(),
  },
  Inventory: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Ledger: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("@/utils/query.utils", () => ({
  balanceQuery: jest.fn(),
}));

import { createMocks } from "node-mocks-http";
import { approvePurchaseOrder } from "../../../pages/api/purchase/approve/[id]";
import db from "@/lib/postgres";
import { balanceQuery } from "@/utils/query.utils";

describe("approvePurchaseOrder", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createMocks({
      method: "PUT",
      query: { id: "1" },
    });
    req = mock.req;
    res = mock.res;
    req.user = { role: "ADMIN" };
  });

  it("returns 400 if ID is missing", async () => {
    req.query.id = undefined;
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toMatchObject({ message: expect.stringContaining("ValidationError") });
  });

  it("returns 400 if user is not admin", async () => {
    req.user.role = "USER";
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({ message: "Operation not permitted." });
  });

  it("returns 404 if purchase not found", async () => {
    db.Purchase.findByPk.mockResolvedValue(null);
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(res._getData()).toEqual({ message: "purchase order does not exist" });
  });

  it("returns 400 if purchase already approved", async () => {
    db.Purchase.findByPk.mockResolvedValue({ status: "APPROVED" });
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual({ message: "purchase order already approved" });
  });

  it("creates inventory and ledger if not existing (revisionNo=0)", async () => {
    const updateMock = jest.fn().mockResolvedValue({});
    db.Purchase.findByPk.mockResolvedValue({
      id: 1,
      status: "PENDING",
      update: updateMock,
      purchasedProducts: [
        {
          id: 1,
          noOfBales: 10,
          baleWeightKgs: 100,
          baleWeightLbs: 200,
          ratePerBale: 50,
        },
      ],
      companyId: 1,
      totalAmount: 1000,
      purchaseDate: "2024-01-01",
      invoiceNumber: "INV001",
      revisionNo: 0,
    });
    db.Inventory.findOne.mockResolvedValue(null);
    db.Inventory.create.mockResolvedValue({});
    db.Ledger.create.mockResolvedValue({});
    balanceQuery.mockResolvedValue([{ amount: 4000 }]);

    await approvePurchaseOrder(req, res);

    expect(updateMock).toHaveBeenCalledWith({ status: "APPROVED" }, expect.any(Object));
    expect(db.Inventory.create).toHaveBeenCalled();
    expect(db.Ledger.create).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it("updates existing inventory & ledger if revisionNo=1", async () => {
    const updateMock = jest.fn().mockResolvedValue({});
    const inventoryMock = {
      increment: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      baleWeightKgs: null,
      baleWeightLbs: null,
    };
    db.Purchase.findByPk.mockResolvedValue({
      id: 1,
      status: "PENDING",
      update: updateMock,
      revisionNo: 1,
      revisionDetails: {
        purchasedProducts: [
          {
            id: 1,
            noOfBales: 5,
            baleWeightKgs: 50,
            baleWeightLbs: 120,
            ratePerBale: 60,
          },
        ],
      },
      companyId: 2,
      totalAmount: 1500,
      purchaseDate: "2024-02-01",
      invoiceNumber: "INV002",
    });
    db.Inventory.findOne.mockResolvedValue(inventoryMock);
    db.Ledger.findOne.mockResolvedValue({
      update: jest.fn().mockResolvedValue({}),
    });

    await approvePurchaseOrder(req, res);

    expect(db.Inventory.findOne).toHaveBeenCalled();
    expect(db.Ledger.findOne).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({ status: "APPROVED" }, expect.any(Object));
    expect(res._getStatusCode()).toBe(200);
  });

  it("handles DB error and rolls back transaction", async () => {
    db.Purchase.findByPk.mockRejectedValue(new Error("Mocked DB error"));
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toMatchObject({ message: expect.stringContaining("Error") });
  });

  it("returns 500 if ledger not found for revision", async () => {
    const updateMock = jest.fn().mockResolvedValue({});
    db.Purchase.findByPk.mockResolvedValue({
      id: 3,
      status: "PENDING",
      update: updateMock,
      revisionNo: 1,
      revisionDetails: {
        purchasedProducts: [
          {
            id: 3,
            noOfBales: 10,
            baleWeightKgs: 80,
            baleWeightLbs: 160,
          },
        ],
      },
      companyId: 4,
      totalAmount: 2100,
      purchaseDate: "2024-03-01",
      invoiceNumber: "INV005",
    });

    db.Inventory.findOne.mockResolvedValue({
      increment: jest.fn(),
      update: jest.fn(),
      baleWeightKgs: null,
      baleWeightLbs: null,
    });

    db.Ledger.findOne.mockResolvedValue(null); // Simulate missing ledger

    await approvePurchaseOrder(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData().message).toMatch(/Cannot read properties of null/);
  });

  it("increments inventory with existing weights", async () => {
    const updateMock = jest.fn().mockResolvedValue({});
    const incrementMock = jest.fn().mockResolvedValue({});
    const inventoryUpdateMock = jest.fn().mockResolvedValue({});

    db.Purchase.findByPk.mockResolvedValue({
      id: 2,
      status: "PENDING",
      update: updateMock,
      revisionNo: 1,
      revisionDetails: {
        purchasedProducts: [
          {
            id: 2,
            noOfBales: 7,
            baleWeightKgs: 70,
            baleWeightLbs: 155,
            ratePerBale: 70,
          },
        ],
      },
      companyId: 3,
      totalAmount: 1700,
      purchaseDate: "2024-02-05",
      invoiceNumber: "INV004",
    });

    db.Inventory.findOne.mockResolvedValue({
      increment: incrementMock,
      update: inventoryUpdateMock,
      baleWeightKgs: 30,
      baleWeightLbs: 40,
    });

    db.Ledger.findOne.mockResolvedValue({
      update: jest.fn().mockResolvedValue({}),
    });

    await approvePurchaseOrder(req, res);

    expect(incrementMock).toHaveBeenCalled();
    expect(inventoryUpdateMock).toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it("handles inventory update with missing optional fields", async () => {
    const updateMock = jest.fn().mockResolvedValue({});
    db.Purchase.findByPk.mockResolvedValue({
      id: 1,
      status: "PENDING",
      update: updateMock,
      purchasedProducts: [
        {
          id: 1,
          noOfBales: 3, // no weights or rates
        },
      ],
      companyId: 1,
      totalAmount: 500,
      purchaseDate: "2024-01-01",
      invoiceNumber: "INV003",
      revisionNo: 0,
    });
    db.Inventory.findOne.mockResolvedValue(null);
    db.Inventory.create.mockResolvedValue({});
    db.Ledger.create.mockResolvedValue({});
    balanceQuery.mockResolvedValue([{ amount: 2000 }]);

    await approvePurchaseOrder(req, res);

    expect(res._getStatusCode()).toBe(200);
  });

  it("returns 400 for invalid ID format (non-numeric)", async () => {
    req.query.id = "abc";
    await approvePurchaseOrder(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toMatchObject({ message: expect.stringContaining("ValidationError") });
  });
});
