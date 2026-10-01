// Regression test: calculateAmount must discriminate Inventory rows from raw
// line items correctly even when given REAL Sequelize model instances, not
// just plain objects. Sequelize instances expose attributes via prototype
// getters backed by `dataValues`, so `Object.prototype.hasOwnProperty` on the
// instance returns false for every attribute, including "onHand" — only the
// `in` operator (which walks the prototype chain) detects it correctly.
const { sequelize, Inventory, Company } = require("../api/test-setup");
import { calculateAmount } from "@/utils/api.util";

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Company.create({ id: 1, companyName: "Supplier A" });
});

afterAll(async () => {
  await sequelize.close();
});

describe("calculateAmount against real Sequelize Inventory instances", () => {
  it("values a fully-stocked Kgs-priced item by total weight, not weight x onHand", async () => {
    await Inventory.create({
      id: 1,
      companyId: 1,
      organizationId: 1,
      itemName: "fully stocked kg item",
      noOfBales: 10,
      onHand: 10,
      baleWeightKgs: 500,
      ratePerKgs: 2,
    });

    const row = await Inventory.findByPk(1);
    expect(calculateAmount(0, row)).toBe(1000); // 2 * 500, NOT 2 * 500 * 10
  });

  it("contributes 0 for a fully sold-out bale-priced item, ignoring stale lifetime noOfBales", async () => {
    await Inventory.create({
      id: 2,
      companyId: 1,
      organizationId: 1,
      itemName: "sold out bale item",
      noOfBales: 50, // lifetime total ever purchased, never decremented on sale
      onHand: 0, // nothing actually left in stock
      ratePerBale: 100,
    });

    const row = await Inventory.findByPk(2);
    expect(calculateAmount(0, row)).toBe(0); // NOT 50 * 100
  });

  it("values a partially-sold bale-priced item by current onHand, not lifetime noOfBales", async () => {
    await Inventory.create({
      id: 3,
      companyId: 1,
      organizationId: 1,
      itemName: "partially sold bale item",
      noOfBales: 10, // lifetime total
      onHand: 4, // 6 of the 10 have been sold
      ratePerBale: 100,
    });

    const row = await Inventory.findByPk(3);
    expect(calculateAmount(0, row)).toBe(400); // 4 * 100, NOT 10 * 100
  });

  it("contributes 0 for a sold-out Kgs-priced item with residual zero weight", async () => {
    await Inventory.create({
      id: 4,
      companyId: 1,
      organizationId: 1,
      itemName: "sold out kg item",
      noOfBales: 10,
      onHand: 0,
      baleWeightKgs: 0,
      ratePerKgs: 2,
    });

    const row = await Inventory.findByPk(4);
    expect(calculateAmount(0, row)).toBe(0);
  });
});
