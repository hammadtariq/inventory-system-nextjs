"use strict";

const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const TABLES = [
  "users",
  "customers",
  "companies",
  "inventories",
  "purchases",
  "purchase_histories",
  "sales",
  "saleReturns",
  "items",
  "ledgers",
  "cheques",
];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

async function run() {
  await sequelize.authenticate();

  const results = [];
  for (const table of TABLES) {
    const [rows] = await sequelize.query(
      `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "organizationId" IS NULL;`
    );
    results.push({ table, nullOrganizationIdCount: rows[0].count });
  }

  console.table(results);

  const failed = results.filter((result) => result.nullOrganizationIdCount !== 0);
  if (failed.length) {
    throw new Error("Tenant backfill verification failed");
  }

  console.log("Tenant backfill verification passed");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
