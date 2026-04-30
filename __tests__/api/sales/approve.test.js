import { approveSaleOrder } from "@/pages/api/sales/approve/[id]";
import db from "@/lib/postgres";
import { STATUS, SPEND_TYPE } from "@/utils/api.util";
import { balanceQuery } from "@/utils/query.utils";
import TenantContext from "@/lib/tenant-context";

jest.mock("@/lib/postgres", () => ({
  __esModule: true,
  default: {
    dbConnect: jest.fn(),
    sequelize: {
      transaction: jest.fn(),
    },
    Sale: {
      findOne: jest.fn(),
    },
    Inventory: {
      findOne: jest.fn(),
    },
    Ledger: {
      create: jest.fn(),
    },
    Customer: {},
    Sequelize: {
      Op: {
        or: Symbol.for("sequelize.or"),
        gte: Symbol.for("sequelize.gte"),
      },
    },
  },
}));
jest.mock("@/utils/query.utils");

describe("approveSaleOrder", () => {
  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    db.dbConnect.mockResolvedValue();
    db.sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  it("should approve a sale order successfully", async () => {
    const mockSale = {
      id: 1,
      status: STATUS.PENDING,
      totalAmount: 100,
      soldDate: "2025-04-22T10:00:00.000Z",
      customerId: 22,
      soldProducts: [
        {
          id: 101,
          itemName: "Jacket",
          noOfBales: 10,
          companyId: 1,
          baleWeightKgs: 50,
          baleWeightLbs: 110,
        },
        {
          id: 102,
          itemName: "Shirt",
          noOfBales: 5,
          companyId: 1,
          baleWeightKgs: 20,
          baleWeightLbs: 44,
        },
      ],
      update: jest.fn().mockResolvedValue(),
    };

    const mockInventory = {
      id: 1,
      onHand: 50,
      baleWeightKgs: 100,
      baleWeightLbs: 220,
      decrement: jest.fn().mockResolvedValue(1),
      reload: jest.fn().mockImplementation(function () {
        this.onHand -= 10;
        return Promise.resolve(this);
      }),
    };

    const mockLedger = {
      id: 999,
      customerId: 22,
      amount: 100,
      spendType: SPEND_TYPE.CREDIT,
      totalBalance: -100,
    };

    db.Sale.findOne.mockResolvedValue(mockSale);
    db.Inventory.findOne.mockResolvedValue(mockInventory);
    balanceQuery.mockResolvedValue([{ amount: 0 }]);
    db.Ledger.create.mockResolvedValue(mockLedger);

    const result = await TenantContext.run(23, async () => approveSaleOrder(1, mockTransaction));

    expect(mockSale.update).toHaveBeenCalledWith({ status: STATUS.APPROVED }, { transaction: mockTransaction });
    expect(mockInventory.decrement).toHaveBeenCalledTimes(2);
    expect(db.Ledger.create).toHaveBeenCalled();
    expect(mockTransaction.commit).toHaveBeenCalled();

    expect(result.sale).toEqual(mockSale);
    expect(result.ledger).toEqual(mockLedger);
  });

  it("should throw 404 if sale order is not found", async () => {
    db.Sale.findOne.mockResolvedValue(null);
    await expect(TenantContext.run(23, async () => approveSaleOrder(999, mockTransaction))).rejects.toThrow(
      "NOT_FOUND:Sale order does not exist"
    );
  });

  it("should throw 400 if sale is already approved", async () => {
    db.Sale.findOne.mockResolvedValue({ status: STATUS.APPROVED });
    await expect(TenantContext.run(23, async () => approveSaleOrder(1, mockTransaction))).rejects.toThrow(
      "BAD_REQUEST:Sale order already approved"
    );
  });

  it("should throw 400 if totalAmount is 0", async () => {
    db.Sale.findOne.mockResolvedValue({
      status: STATUS.PENDING,
      totalAmount: 0,
    });
    await expect(TenantContext.run(23, async () => approveSaleOrder(1, mockTransaction))).rejects.toThrow(
      "BAD_REQUEST:Sale order cannot be approved with total amount 0."
    );
  });

  it("should throw 404 if inventory is insufficient", async () => {
    const saleMock = {
      status: STATUS.PENDING,
      totalAmount: 100,
      soldProducts: [{ id: 1, noOfBales: 10, itemName: "Shirt", companyId: 1 }],
    };
    db.Sale.findOne.mockResolvedValue(saleMock);
    db.Inventory.findOne.mockResolvedValue(null);
    await expect(TenantContext.run(23, async () => approveSaleOrder(1, mockTransaction))).rejects.toThrow(
      'NOT_FOUND:"Shirt" is out of stock'
    );
  });

  it("should rollback and throw 500 on unknown errors", async () => {
    db.Sale.findOne.mockRejectedValue(new Error("Something went wrong"));
    await expect(TenantContext.run(23, async () => approveSaleOrder(1, mockTransaction))).rejects.toThrow(
      "Something went wrong"
    );
    expect(mockTransaction.rollback).toHaveBeenCalled();
  });
});
