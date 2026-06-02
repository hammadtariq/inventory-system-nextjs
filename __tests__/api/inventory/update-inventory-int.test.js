// __tests__/api/purchase/update-inventory-int.test.js
const { sequelize, Inventory, Customer, Sale, Ledger } = require("../test-setup");
jest.mock("@/lib/postgres", () => {
  const { sequelize, Inventory, Customer, Sale, Ledger } = require("../test-setup");
  const Sequelize = require("sequelize");
  return {
    dbConnect: jest.fn().mockResolvedValue(),
    Inventory,
    Sequelize,
    sequelize,
    Customer,
    Sale,
    Ledger,
    Purchase: { findByPk: jest.fn(), update: jest.fn() },
    Ledger: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
    Company: {},
  };
});
import { updateInventory } from "@/pages/api/purchase/approve/[id]";
import { approveSaleOrder } from "@/pages/api/sales/approve/[id]";
import TenantContext from "@/lib/tenant-context";

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("updateInventory integration", () => {
  it("increments noOfBales properly for multiple items and rejects reductions below zero", async () => {
    await Inventory.bulkCreate([
      {
        id: 1,
        companyId: 1,
        organizationId: 23,
        itemName: "cotton",
        noOfBales: 10,
        onHand: 10,
        baleWeightKgs: 100,
        baleWeightLbs: 100,
      },
      {
        id: 524,
        companyId: 1,
        organizationId: 23,
        itemName: "men tropical pant xl",
        noOfBales: "5",
        onHand: "5",
        baleWeightKgs: 10,
        baleWeightLbs: 20,
      },
      {
        id: 500,
        companyId: 1,
        organizationId: 23,
        itemName: "white bed cover",
        noOfBales: 0,
        onHand: 0,
        baleWeightKgs: 0,
        baleWeightLbs: 0,
      },
    ]);

    const t = await sequelize.transaction();

    await expect(
      TenantContext.run(23, async () =>
        updateInventory(
          [
            {
              id: 1,
              noOfBales: 10,
              baleWeightKgs: 20,
              baleWeightLbs: 40,
              ratePerBale: 5,
            },
            {
              id: 524,
              itemName: "men tropical pant xl",
              noOfBales: "10",
              ratePerKgs: 1,
              ratePerLbs: 1,
              ratePerBale: 1,
              baleWeightKgs: 0,
              baleWeightLbs: 0,
            },
            {
              id: 500,
              itemName: "white bed cover",
              noOfBales: -3,
              ratePerKgs: 1,
              ratePerLbs: 1,
              ratePerBale: 1,
              baleWeightKgs: 0,
              baleWeightLbs: 0,
            },
          ],
          1,
          t
        )
      )
    ).rejects.toThrow("white bed cover onHand cannot be reduced below zero");

    await t.rollback();

    const retryTransaction = await sequelize.transaction();

    await TenantContext.run(23, async () =>
      updateInventory(
        [
          {
            id: 1,
            noOfBales: 10,
            baleWeightKgs: 20,
            baleWeightLbs: 40,
            ratePerBale: 5,
          },
          {
            id: 524,
            itemName: "men tropical pant xl",
            noOfBales: "10",
            ratePerKgs: 1,
            ratePerLbs: 1,
            ratePerBale: 1,
            baleWeightKgs: 0,
            baleWeightLbs: 0,
          },
        ],
        1,
        retryTransaction
      )
    );

    await retryTransaction.commit();

    const cotton = await Inventory.findByPk(1);
    const pant = await Inventory.findByPk(524);

    expect(cotton.noOfBales).toBe(20);
    expect(cotton.onHand).toBe(20);
    expect(cotton.baleWeightKgs).toBe(120);
    expect(cotton.baleWeightLbs).toBe(140);

    expect(pant.noOfBales).toBe(15); // 5 + 10
    expect(pant.onHand).toBe(15);
    expect(pant.baleWeightKgs).toBe(10); // unchanged
    expect(pant.baleWeightLbs).toBe(20); // unchanged

    const bedCover = await Inventory.findByPk(500);
    expect(bedCover.noOfBales).toBe(0);
    expect(bedCover.onHand).toBe(0);
  });

  it("decrements inventory correctly upon sale approval", async () => {
    const customer = await Customer.create({
      id: 1,
      firstName: "Test",
      lastName: "Customer",
      email: "abc@gmail.com",
      organizationId: 23,
    });
    await Ledger.create({
      customerId: customer.id,
      paymentType: "CASH",
      spendType: "DEBIT",
      amount: 5000,
      organizationId: 23,
    });

    await Inventory.create({
      id: 100,
      companyId: 1,
      organizationId: 23,
      itemName: "cotton roll",
      noOfBales: 20,
      onHand: 20,
      baleWeightKgs: 200,
      baleWeightLbs: 220,
    });

    await Sale.create({
      id: 999,
      customerId: 1,
      companyId: 1,
      organizationId: 23,
      status: "PENDING",
      soldDate: new Date(),
      totalAmount: 1000,
      soldProducts: [
        {
          id: 100,
          itemName: "cotton roll",
          noOfBales: 5,
          baleWeightKgs: 50,
          baleWeightLbs: 60,
          companyId: 1,
        },
      ],
    });

    const t = await sequelize.transaction();

    const { inventory } = await TenantContext.run(23, async () => approveSaleOrder(999, t)); // real method call

    const updated = await Inventory.findByPk(100);

    expect(updated.onHand).toBe(15); // 20 - 5
    expect(updated.baleWeightKgs).toBe(150); // 200 - 50
    expect(updated.baleWeightLbs).toBe(160); // 220 - 60

    expect(inventory[0].onHand).toBe(15);
    expect(inventory[0].baleWeightKgs).toBe(150);
    expect(inventory[0].baleWeightLbs).toBe(160);
  });
});
