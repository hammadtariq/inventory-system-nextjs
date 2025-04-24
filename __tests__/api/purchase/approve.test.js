import { approvePurchaseOrder, updateInventory, updateLedger } from "@/pages/api/purchase/approve/[id]";
import db from "@/lib/postgres";
import { balanceQuery } from "@/utils/query.utils";

jest.mock("@/lib/postgres", () => ({
  dbConnect: jest.fn().mockResolvedValue(),
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  },
  Purchase: { findByPk: jest.fn(), update: jest.fn() },
  Inventory: { findOne: jest.fn(), create: jest.fn(), update: jest.fn(), increment: jest.fn() },
  Ledger: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
  Company: {},
}));

jest.mock("@/utils/query.utils", () => ({
  balanceQuery: jest.fn(),
}));

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
    db.Purchase.findByPk.mockResolvedValue(null);
    const res = await approvePurchaseOrder(1, { role: "ADMIN" });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/does not exist/);
  });

  it("should return 400 if purchase is already approved", async () => {
    db.Purchase.findByPk.mockResolvedValue({ status: "APPROVED" });
    const res = await approvePurchaseOrder(1, { role: "ADMIN" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already approved/);
  });

  it("should handle DB error and rollback", async () => {
    db.Purchase.findByPk.mockImplementation(() => {
      throw new Error("db error");
    });
    const res = await approvePurchaseOrder(1, { role: "ADMIN" });
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

    const mockInventory = {
      increment: jest.fn(),
      update: jest.fn(),
      baleWeightKgs: 0,
      baleWeightLbs: 0,
    };

    const mockLedger = {
      id: 10942,
      amount: 10,
      spendType: "DEBIT",
      invoiceNumber: null,
      paymentDate: "2025-04-22T12:37:45.496Z",
      totalBalance: 10,
    };

    db.Purchase.findByPk.mockResolvedValue(mockPurchase);
    db.Inventory.findOne.mockResolvedValue(mockInventory);
    db.Ledger.findOne.mockResolvedValue(null);
    db.Ledger.create.mockResolvedValue(mockLedger);
    balanceQuery.mockResolvedValue([{ amount: 0 }]);

    const res = await approvePurchaseOrder(772, { role: "ADMIN" });

    expect(mockPurchase.update).toHaveBeenCalledWith(
      {
        status: "APPROVED",
      },
      { transaction: mockTransaction }
    );
    expect(db.Inventory.findOne).toHaveBeenCalled();
    expect(db.Ledger.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();

    expect(res.status).toBe(200);
    expect(res.body.inventory).toBeDefined();
    expect(res.body.ledger).toEqual(mockLedger);
    expect(res.body.inventory[0]).toMatchObject(mockInventory);
    expect(res.body.inventory[1]).toMatchObject(mockInventory);

    expect(res.body.purchaseOrder).toEqual(updatedMockPurchase);
  });
});

describe("updateInventory", () => {
  const transaction = {};
  const product = {
    id: 1,
    noOfBales: "5",
    baleWeightKgs: 100,
    baleWeightLbs: 200,
    ratePerBale: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create inventory if not found", async () => {
    db.Inventory.findOne.mockResolvedValue(null);
    db.Inventory.create.mockResolvedValue({ id: 123 });

    const res = await updateInventory([product], 1, transaction);
    expect(res).toHaveLength(1);
    expect(db.Inventory.create).toHaveBeenCalled();
  });

  it("should update inventory with null weights", async () => {
    const mockInv = {
      increment: jest.fn(),
      update: jest.fn(),
      baleWeightKgs: null,
      baleWeightLbs: null,
    };
    db.Inventory.findOne.mockResolvedValue(mockInv);

    await updateInventory([product], 1, transaction);
    expect(mockInv.increment).toHaveBeenCalled();
    expect(mockInv.update).toHaveBeenCalled();
  });

  it("should update inventory with existing weights", async () => {
    const mockInv = {
      increment: jest.fn(),
      update: jest.fn(),
      baleWeightKgs: 100,
      baleWeightLbs: 200,
    };
    db.Inventory.findOne.mockResolvedValue(mockInv);

    await updateInventory([product], 1, transaction);
    expect(mockInv.increment).toHaveBeenCalledWith(expect.any(Object), { transaction });
    expect(mockInv.update).toHaveBeenCalled();
  });

  it("should update existing inventory record", async () => {
    const mockInventory = {
      increment: jest.fn(),
      update: jest.fn(),
      baleWeightKgs: 20,
      baleWeightLbs: 30,
    };
    db.Inventory.findOne.mockResolvedValue(mockInventory);

    await updateInventory(
      [
        {
          id: 849,
          noOfBales: 10,
          ratePerKgs: 1,
          ratePerLbs: 1,
          ratePerBale: 1,
          baleWeightKgs: 0,
          baleWeightLbs: 0,
        },
      ],
      36,
      {}
    );

    expect(mockInventory.increment).toHaveBeenCalledWith(
      expect.objectContaining({
        noOfBales: 10,
      }),
      { transaction: {} }
    );
    expect(mockInventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ratePerBale: 1,
        ratePerLbs: 1,
        ratePerKgs: 1,
      }),
      { transaction: expect.any(Object) }
    );
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

    const result = await updateLedger(1, baseProps);
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

    const result = await updateLedger(0, baseProps);
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
    const result = await updateLedger(0, baseProps);
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
