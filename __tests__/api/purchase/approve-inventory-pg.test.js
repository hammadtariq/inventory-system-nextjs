import { updateInventory } from "@/pages/api/purchase/approve/[id]";
import TenantContext from "@/lib/tenant-context";

const harness = require("./pg-harness");

jest.mock("@/lib/postgres", () => require("./pg-harness").db);

const { db } = harness;
const ORG = 23;
const OTHER_ORG = 99;
const COMPANY = 36;

const stockRow = (overrides = {}) => ({
  companyId: COMPANY,
  organizationId: ORG,
  itemName: "white bed cover",
  noOfBales: 0,
  onHand: 0,
  baleWeightKgs: null,
  baleWeightLbs: null,
  ratePerKgs: null,
  ratePerLbs: null,
  ratePerBale: null,
  ...overrides,
});

const seed = (rows) => db.Inventory.bulkCreate(rows.map(stockRow), { tenantBypass: true });

const approve = (products, { organizationId = ORG, companyId = COMPANY } = {}) =>
  TenantContext.run(organizationId, () =>
    db.sequelize.transaction((transaction) => updateInventory(products, companyId, transaction))
  );

const row = async (id) => (await db.Inventory.findOne({ where: { id }, tenantBypass: true })).get({ plain: true });

const describeWithDb = harness.hasDatabase ? describe : describe.skip;

describeWithDb("updateInventory on Postgres", () => {
  beforeAll(() => harness.resetSchema());
  beforeEach(() => db.Inventory.destroy({ truncate: true, tenantBypass: true }));
  afterAll(() => harness.close());

  it("adds purchased bales to an item already in stock", async () => {
    await seed([{ id: 1, noOfBales: 4, onHand: 3 }]);

    await approve([{ id: 1, noOfBales: 10 }]);

    expect(await row(1)).toMatchObject({ noOfBales: 14, onHand: 13 });
  });

  it("creates a stock row, keyed by the item id, for an item not in stock yet", async () => {
    await approve([{ id: 7, itemName: "men tropical pant xl", noOfBales: 10, baleWeightLbs: 450, ratePerBale: 12 }]);

    expect(await row(7)).toMatchObject({
      companyId: COMPANY,
      organizationId: ORG,
      itemName: "men tropical pant xl",
      noOfBales: 10,
      onHand: 10,
      baleWeightLbs: 450,
      ratePerBale: 12,
    });
  });

  it("adds purchased weight to a stored weight", async () => {
    await seed([{ id: 1, baleWeightKgs: 100, baleWeightLbs: 220 }]);

    await approve([{ id: 1, noOfBales: 1, baleWeightKgs: 50, baleWeightLbs: 110 }]);

    expect(await row(1)).toMatchObject({ baleWeightKgs: 150, baleWeightLbs: 330 });
  });

  it("sets an empty stored weight to the purchased weight, never below zero", async () => {
    await seed([{ id: 1 }]);

    await approve([{ id: 1, noOfBales: 1, baleWeightKgs: 50, baleWeightLbs: -5 }]);

    expect(await row(1)).toMatchObject({ baleWeightKgs: 50, baleWeightLbs: 0 });
  });

  it("leaves a stored weight alone when the purchase line has no weight", async () => {
    await seed([{ id: 1, baleWeightKgs: 100, baleWeightLbs: 220 }]);

    await approve([{ id: 1, noOfBales: 2 }]);

    expect(await row(1)).toMatchObject({ baleWeightKgs: 100, baleWeightLbs: 220 });
  });

  it("leaves a stored weight alone when the purchase line's weight is null", async () => {
    await seed([{ id: 1, baleWeightKgs: 100, baleWeightLbs: 220 }]);

    await approve([{ id: 1, noOfBales: 2, baleWeightKgs: null, baleWeightLbs: 0 }]);

    expect(await row(1)).toMatchObject({ baleWeightKgs: 100, baleWeightLbs: 220 });
  });

  it("uses the purchase's rates, keeping stored rates the purchase leaves blank", async () => {
    await seed([{ id: 1, ratePerBale: 10, ratePerKgs: 2, ratePerLbs: 1 }]);

    await approve([{ id: 1, noOfBales: 1, ratePerBale: 20, ratePerKgs: 0 }]);

    expect(await row(1)).toMatchObject({ ratePerBale: 20, ratePerKgs: 2, ratePerLbs: 1 });
  });

  it("adds both lines when the same item appears twice in one purchase", async () => {
    await seed([{ id: 1, noOfBales: 1, onHand: 1, baleWeightKgs: 10 }]);

    await approve([
      { id: 1, noOfBales: 2, baleWeightKgs: 5 },
      { id: 1, noOfBales: 3, baleWeightKgs: 7 },
    ]);

    expect(await row(1)).toMatchObject({ noOfBales: 6, onHand: 6, baleWeightKgs: 22 });
  });

  it("adds both lines when an item not in stock appears twice in one purchase", async () => {
    await approve([
      { id: 7, itemName: "men tropical pant xl", noOfBales: 2, baleWeightKgs: 5 },
      { id: 7, itemName: "men tropical pant xl", noOfBales: 3, baleWeightKgs: 7 },
    ]);

    expect(await row(7)).toMatchObject({ noOfBales: 5, onHand: 5, baleWeightKgs: 12 });
  });

  it("treats quantities sent as strings as numbers", async () => {
    await seed([{ id: 1, noOfBales: 4, onHand: 4, baleWeightKgs: 100 }]);

    await approve([{ id: 1, noOfBales: "5", baleWeightKgs: "25" }]);

    expect(await row(1)).toMatchObject({ noOfBales: 9, onHand: 9, baleWeightKgs: 125 });
  });

  it("subtracts a revision that reduced the quantity", async () => {
    await seed([{ id: 1, noOfBales: 10, onHand: 8, baleWeightKgs: 100 }]);

    await approve([{ id: 1, noOfBales: -3, baleWeightKgs: -30 }]);

    expect(await row(1)).toMatchObject({ noOfBales: 7, onHand: 5, baleWeightKgs: 70 });
  });

  it("handles items in stock and items not in stock in the same purchase", async () => {
    await seed([{ id: 1, noOfBales: 4, onHand: 4 }]);

    const result = await approve([
      { id: 1, noOfBales: 1 },
      { id: 2, itemName: "blue jeans", noOfBales: 6 },
    ]);

    expect(result).toHaveLength(2);
    expect(await row(1)).toMatchObject({ noOfBales: 5, onHand: 5 });
    expect(await row(2)).toMatchObject({ itemName: "blue jeans", noOfBales: 6, onHand: 6 });
  });

  it("runs at most one query per product, plus one read and one insert", async () => {
    await seed(Array.from({ length: 10 }, (_, i) => ({ id: i + 1, baleWeightKgs: 100, baleWeightLbs: 220 })));
    const products = [
      ...Array.from({ length: 10 }, (_, i) => ({ id: i + 1, noOfBales: 2, baleWeightKgs: 5, ratePerBale: 9 })),
      ...Array.from({ length: 5 }, (_, i) => ({ id: 100 + i, itemName: `new item ${i}`, noOfBales: 3 })),
    ];

    let queryCount;
    await TenantContext.run(ORG, () =>
      db.sequelize.transaction(async (transaction) => {
        harness.queries.length = 0;
        await updateInventory(products, COMPANY, transaction);
        queryCount = harness.queries.length;
      })
    );

    expect(queryCount).toBeLessThanOrEqual(products.length + 2);
  });

  it("never changes another organization's stock", async () => {
    await seed([{ id: 1, organizationId: OTHER_ORG, noOfBales: 4, onHand: 4 }]);

    await expect(approve([{ id: 1, itemName: "white bed cover", noOfBales: 10 }])).rejects.toThrow();

    expect(await row(1)).toMatchObject({ organizationId: OTHER_ORG, noOfBales: 4, onHand: 4 });
  });
});
