// Benchmark for updateInventory during purchase approval (#257). Not part of `pnpm test`; run with:
// TEST_POSTGRES_URL=postgres://localhost:5432/inventory_test npx jest --watchman=false \
//   --testMatch '**/approve-inventory.bench.js'
// Simulated latency is added before every query to stand in for the network round trip to the database.
import { updateInventory } from "@/pages/api/purchase/approve/[id]";
import TenantContext from "@/lib/tenant-context";

const harness = require("./pg-harness");

jest.mock("@/lib/postgres", () => require("./pg-harness").db);

const { db } = harness;
const ORG = 23;
const COMPANY = 36;
const IN_STOCK = 30;
const NEW_ITEMS = 10;
const LATENCIES_MS = [0, 2, 50];

const products = [
  ...Array.from({ length: IN_STOCK }, (_, i) => ({
    id: i + 1,
    noOfBales: 5,
    baleWeightKgs: 100,
    baleWeightLbs: 220,
    ratePerBale: 12,
  })),
  ...Array.from({ length: NEW_ITEMS }, (_, i) => ({
    id: IN_STOCK + i + 1,
    itemName: `new item ${i + 1}`,
    noOfBales: 5,
    baleWeightKgs: 100,
    baleWeightLbs: 220,
    ratePerBale: 12,
  })),
];

const seedStock = () =>
  db.Inventory.bulkCreate(
    Array.from({ length: IN_STOCK }, (_, i) => ({
      id: i + 1,
      companyId: COMPANY,
      organizationId: ORG,
      itemName: `item ${i + 1}`,
      noOfBales: 10,
      onHand: 10,
      baleWeightKgs: 200,
      baleWeightLbs: 440,
    })),
    { tenantBypass: true }
  );

const describeWithDb = harness.hasDatabase ? describe : describe.skip;

describeWithDb("updateInventory benchmark", () => {
  beforeAll(() => harness.resetSchema());
  afterAll(() => harness.close());

  it(`approves ${IN_STOCK} in-stock + ${NEW_ITEMS} new items`, async () => {
    const rows = [];

    for (const latency of LATENCIES_MS) {
      harness.setLatency(0);
      await db.Inventory.destroy({ truncate: true, tenantBypass: true });
      await seedStock();

      harness.setLatency(latency);
      let queryCount = 0;
      let ms = 0;
      await TenantContext.run(ORG, () =>
        db.sequelize.transaction(async (transaction) => {
          harness.queries.length = 0;
          const start = process.hrtime.bigint();
          await updateInventory(products, COMPANY, transaction);
          ms = Number(process.hrtime.bigint() - start) / 1e6;
          queryCount = harness.queries.length;
        })
      );
      harness.setLatency(0);

      rows.push({
        "latency/query": `${latency} ms`,
        queries: queryCount,
        "updateInventory time": `${ms.toFixed(0)} ms`,
      });
    }

    console.table(rows);
  }, 120000);
});
