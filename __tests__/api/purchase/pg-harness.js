// Real-Postgres harness for purchase approval tests. Set TEST_POSTGRES_URL to a disposable database, e.g.
// TEST_POSTGRES_URL=postgres://localhost:5432/inventory_test pnpm test -- approve-inventory
// Tests using it skip when the variable is unset (CI has no database for Jest).
const { Sequelize, DataTypes } = require("sequelize");
const inventoryModel = require("@/models/inventory");
const { applyTenantWriteHooks } = require("@/lib/tenant-write-hooks");

const url = process.env.TEST_POSTGRES_URL;

const queries = [];
let latencyMs = 0;

// Constructing Sequelize doesn't connect, so a placeholder URL is safe when the variable is unset.
const sequelize = new Sequelize(url || "postgres://localhost:5432/unused", {
  logging: (sql) => queries.push(sql),
});

// Simulates the round trip to a remote database, for benchmarks.
sequelize.addHook("beforeQuery", async () => {
  if (latencyMs) await new Promise((resolve) => setTimeout(resolve, latencyMs));
});

const Inventory = inventoryModel(sequelize, DataTypes);
applyTenantWriteHooks(Inventory);

module.exports = {
  hasDatabase: Boolean(url),
  db: { sequelize, Sequelize, Inventory },
  queries,
  setLatency: (ms) => {
    latencyMs = ms;
  },
  resetSchema: () => Inventory.sync({ force: true }),
  close: () => sequelize.close(),
};
