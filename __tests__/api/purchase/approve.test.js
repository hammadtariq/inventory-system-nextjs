import { approvePurchaseOrder, updateLedger } from "@/pages/api/purchase/approve/[id]";
import db from "@/lib/postgres";
import { balanceQuery } from "@/utils/query.utils";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn().mockResolvedValue(),
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue(),
    literal: jest.fn((value) => value),
  },
  Purchase: { findOne: jest.fn(), update: jest.fn() },
  Inventory: { findAll: jest.fn(), bulkCreate: jest.fn() },
  Ledger: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  Company: {},
  Sequelize: {
    Op: {
      gt: Symbol.for("sequelize.gt"),
    },
  },
}));

jest.mock("@/utils/query.utils", () => ({
  balanceQuery: jest.fn(),
}));

// A locked stock row as findAll returns it: the handler reads it with get(), changes it with set(), writes with save().
const mockStockRow = (values) => ({
  ...values,
  get: jest.fn(() => values),
  set: jest.fn(),
  save: jest.fn(),
});

describe("approvePurchaseOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 403 if user is not ADMIN", async () => {
    const res = await approvePurchaseOrder(1, { role: "USER" });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Operation not permitted.");
  });

  it("should return 404 if purchase is not found", async () => {
    db.Purchase.findOne.mockResolvedValue(null);
    const res = await TenantContext.run(23, async () => approvePurchaseOrder(1, { role: "ADMIN" }));
    expect(db.sequelize.query).toHaveBeenCalledWith("SET LOCAL app.tenant_id = :organizationId", {
      transaction: expect.any(Object),
      replacements: { organizationId: 23 },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/does not exist/);
  });

  it("should return 400 if purchase is already approved", async () => {
    db.Purchase.findOne.mockResolvedValue({ status: "APPROVED" });
    const res = await TenantContext.run(23, async () => approvePurchaseOrder(1, { role: "ADMIN" }));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already approved/);
  });

  it("should handle DB error and rollback", async () => {
    db.Purchase.findOne.mockImplementation(() => {
      throw new Error("db error");
    });
    const res = await TenantContext.run(23, async () => approvePurchaseOrder(1, { role: "ADMIN" }));
    expect(res.status).toBe(500);
    expect(res.body.message).toEqual("db error");
  });

  it("should approve a purchase order successfully", async () => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    db.sequelize.transaction.mockResolvedValue(mockTransaction);

    const mockPurchase = {
      id: 772,
      status: "PENDING",
      totalAmount: 10,
      surCharge: null,
      invoiceNumber: null,
      revisionNo: 0,
      baleType: "SMALL_BALES",
      purchaseDate: "2025-04-22T12:37:45.496Z",
      companyId: 36,
      revisionDetails: {
        companyId: 36,
        totalAmount: 10,
        purchaseDate: {},
        purchasedProducts: [
          {
            id: 518,
            noOfBales: -10,
          },
        ],
      },
      purchasedProducts: [
        {
          id: 524,
          itemName: "men tropical pant xl",
          noOfBales: 10,
          ratePerKgs: 1,
          ratePerLbs: 1,
          ratePerBale: 1,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
        {
          id: 500,
          itemName: "white bed cover",
          noOfBales: 10,
          ratePerKgs: 1,
          ratePerLbs: 1,
          ratePerBale: 1,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
    };

    const updatedMockPurchase = {
      ...mockPurchase,
      status: "APPROVED",
    };

    mockPurchase.update = jest.fn().mockResolvedValue(updatedMockPurchase);

    const stockValues = { onHand: 5, noOfBales: 5, baleWeightKgs: 0, baleWeightLbs: 0 };
    const inventories = [mockStockRow({ id: 524, ...stockValues }), mockStockRow({ id: 500, ...stockValues })];

    const mockLedger = {
      id: 10942,
      amount: 10,
      spendType: "DEBIT",
      invoiceNumber: null,
      paymentDate: "2025-04-22T12:37:45.496Z",
      totalBalance: 10,
    };

    db.Purchase.findOne.mockResolvedValue(mockPurchase);
    db.Inventory.findAll.mockResolvedValue(inventories);
    db.Ledger.findOne.mockResolvedValue(null);
    db.Ledger.create.mockResolvedValue(mockLedger);
    balanceQuery.mockResolvedValue([{ amount: 0 }]);

    const res = await TenantContext.run(23, async () => approvePurchaseOrder(772, { role: "ADMIN" }));

    expect(mockPurchase.update).toHaveBeenCalledWith(
      {
        status: "APPROVED",
      },
      { transaction: mockTransaction }
    );
    expect(inventories[0].set).toHaveBeenCalledWith(expect.objectContaining({ onHand: 15, noOfBales: 15 }));
    expect(inventories[1].set).toHaveBeenCalledWith(expect.objectContaining({ onHand: 15, noOfBales: 15 }));
    expect(inventories[0].save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(db.Inventory.bulkCreate).not.toHaveBeenCalled();
    expect(db.Ledger.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();

    expect(res.status).toBe(200);
    expect(res.body.inventory).toBeDefined();
    expect(res.body.ledger).toEqual(mockLedger);
    expect(res.body.inventory).toEqual(inventories);

    expect(res.body.purchaseOrder).toEqual(updatedMockPurchase);
  });

  it("should hydrate revised purchase products before creating inventory", async () => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    db.sequelize.transaction.mockResolvedValue(mockTransaction);

    const mockPurchase = {
      id: 900,
      status: "PENDING",
      totalAmount: 10,
      surCharge: null,
      invoiceNumber: null,
      revisionNo: 1,
      baleType: "SMALL_BALES",
      purchaseDate: "2025-04-22T12:37:45.496Z",
      companyId: 36,
      revisionDetails: {
        purchasedProducts: [
          {
            id: 524,
            noOfBales: 15,
          },
        ],
      },
      purchasedProducts: [
        {
          id: 524,
          companyId: 36,
          itemName: "men tropical pant xl",
          noOfBales: 10,
          ratePerKgs: 1,
          ratePerLbs: 1,
          ratePerBale: 1,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
      update: jest.fn().mockResolvedValue({ status: "APPROVED" }),
    };

    db.Purchase.findOne.mockResolvedValue(mockPurchase);
    db.Inventory.findAll.mockResolvedValue([]);
    db.Inventory.bulkCreate.mockResolvedValue([{ id: 524 }]);
    db.Ledger.findOne.mockResolvedValue({
      amount: 10,
      totalBalance: 10,
      update: jest.fn(),
    });
    db.Ledger.create.mockResolvedValue({ id: 2 });
    balanceQuery.mockResolvedValue([{ amount: 0 }]);

    const res = await TenantContext.run(23, async () => approvePurchaseOrder(900, { role: "ADMIN" }));

    expect(db.Inventory.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          itemName: "men tropical pant xl",
          companyId: 36,
          onHand: 15,
        }),
      ],
      { transaction: mockTransaction, validate: true }
    );
    expect(res.status).toBe(200);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });

  it("should hydrate revised purchase products when ids are stringified", async () => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    db.sequelize.transaction.mockResolvedValue(mockTransaction);

    const mockPurchase = {
      id: 901,
      status: "PENDING",
      totalAmount: 10,
      surCharge: null,
      invoiceNumber: null,
      revisionNo: 1,
      baleType: "SMALL_BALES",
      purchaseDate: "2025-04-22T12:37:45.496Z",
      companyId: 36,
      revisionDetails: {
        purchasedProducts: [
          {
            id: "524",
            noOfBales: 15,
          },
        ],
      },
      purchasedProducts: [
        {
          id: 524,
          companyId: 36,
          itemName: "men tropical pant xl",
          noOfBales: 10,
          ratePerKgs: 1,
          ratePerLbs: 1,
          ratePerBale: 1,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
      update: jest.fn().mockResolvedValue({ status: "APPROVED" }),
    };

    db.Purchase.findOne.mockResolvedValue(mockPurchase);
    db.Inventory.findAll.mockResolvedValue([]);
    db.Inventory.bulkCreate.mockResolvedValue([{ id: 524 }]);
    db.Ledger.findOne.mockResolvedValue({
      amount: 10,
      totalBalance: 10,
      update: jest.fn(),
    });
    db.Ledger.create.mockResolvedValue({ id: 2 });
    balanceQuery.mockResolvedValue([{ amount: 0 }]);

    const res = await TenantContext.run(23, async () => approvePurchaseOrder(901, { role: "ADMIN" }));

    expect(db.Inventory.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          itemName: "men tropical pant xl",
          companyId: 36,
          onHand: 15,
        }),
      ],
      { transaction: mockTransaction, validate: true }
    );
    expect(res.status).toBe(200);
  });

  it("should not re-add unchanged revised purchase product quantities", async () => {
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    db.sequelize.transaction.mockResolvedValue(mockTransaction);

    const mockPurchase = {
      id: 902,
      status: "PENDING",
      totalAmount: 30,
      invoiceNumber: "INV-1",
      revisionNo: 1,
      purchaseDate: "2025-04-22T12:37:45.496Z",
      companyId: 36,
      revisionDetails: {
        previousPurchasedProducts: [
          {
            id: 524,
            companyId: 36,
            itemName: "men tropical pant xl",
            noOfBales: 3,
            ratePerBale: 10,
          },
        ],
        purchasedProducts: [
          {
            id: 524,
            ratePerBale: 20,
          },
        ],
      },
      purchasedProducts: [
        {
          id: 524,
          companyId: 36,
          itemName: "men tropical pant xl",
          noOfBales: 3,
          ratePerBale: 10,
        },
      ],
      update: jest.fn().mockResolvedValue({ status: "APPROVED" }),
    };

    const mockInventory = mockStockRow({
      id: 524,
      onHand: 3,
      noOfBales: 3,
      baleWeightKgs: 0,
      baleWeightLbs: 0,
      ratePerBale: 10,
    });

    db.Purchase.findOne.mockResolvedValue(mockPurchase);
    db.Inventory.findAll.mockResolvedValue([mockInventory]);
    db.Ledger.findOne.mockResolvedValue({
      amount: 20,
      totalBalance: 20,
      update: jest.fn(),
    });

    const res = await TenantContext.run(23, async () => approvePurchaseOrder(902, { role: "ADMIN" }));

    expect(mockInventory.set).toHaveBeenCalledWith(
      expect.objectContaining({ onHand: 3, noOfBales: 3, ratePerBale: 20 })
    );
    expect(mockInventory.save).toHaveBeenCalledWith({ transaction: mockTransaction });
    expect(res.status).toBe(200);
    expect(mockTransaction.commit).toHaveBeenCalled();
  });
});

describe("updateLedger", () => {
  const transaction = {};
  const baseProps = {
    companyId: 1,
    transactionId: 101,
    totalAmount: 5000,
    purchaseDate: "2024-04-01",
    invoiceNumber: "INV-999",
    t: transaction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update ledger if revision number > 0", async () => {
    const ledgerMock = {
      update: jest.fn().mockResolvedValue(true),
      amount: 5000,
      spendType: "DEBIT",
      invoiceNumber: "INV-999",
      paymentDate: "2024-04-01",
      totalBalance: 6000,
    };
    db.Ledger.findOne.mockResolvedValue(ledgerMock);

    const result = await TenantContext.run(23, async () => updateLedger(1, baseProps));
    expect(ledgerMock.update).toHaveBeenCalled();
    expect(result).toEqual(ledgerMock);
  });

  it("should create new ledger if revision number is 0", async () => {
    const createdLedger = {
      companyId: 1,
      amount: 5000,
      transactionId: 101,
      spendType: "DEBIT",
      invoiceNumber: "INV-999",
      paymentDate: "2024-04-01",
      totalBalance: 6000,
    };

    db.Ledger.create.mockResolvedValue(createdLedger);
    balanceQuery.mockResolvedValue([{ amount: 1000 }]);

    const result = await TenantContext.run(23, async () => updateLedger(0, baseProps));
    expect(db.Ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 1,
        amount: 5000,
        transactionId: 101,
        spendType: "DEBIT",
        invoiceNumber: "INV-999",
        paymentDate: "2024-04-01",
        totalBalance: 6000,
      }),
      { transaction: {} }
    );
    expect(result).toEqual(createdLedger);
  });

  it("should handle case when balance query returns empty", async () => {
    balanceQuery.mockResolvedValue([]);
    const result = await TenantContext.run(23, async () => updateLedger(0, baseProps));
    expect(result).toEqual({
      amount: 5000,
      companyId: 1,
      invoiceNumber: "INV-999",
      paymentDate: "2024-04-01",
      spendType: "DEBIT",
      totalBalance: 6000,
      transactionId: 101,
    });
  });
});
