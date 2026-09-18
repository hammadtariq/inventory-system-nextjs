"use strict";

const Sequelize = require("sequelize");
const verifyTenantBackfill = require("./verify-tenant-backfill");
const verifyRls = require("./verify-rls");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const TENANT_TABLES = [
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

const RLS_TABLES = TENANT_TABLES.filter((table) => table !== "users");

const REQUIRED_INDEXES = ["customers_organization_id_email_unique", "companies_organization_id_company_name_unique"];

const sqlList = (values) => values.map((value) => sequelize.escape(value)).join(", ");

async function verifyRole() {
  const rows = await sequelize.query(
    `SELECT current_user AS role_name, rolsuper, rolbypassrls
     FROM pg_roles
     WHERE rolname = current_user`,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const role = rows[0];
  if (!role) {
    throw new Error("Unable to determine current database role.");
  }

  if (role.rolsuper || role.rolbypassrls) {
    throw new Error(
      `Current database role "${role.role_name}" still bypasses RLS. Use a non-superuser, non-BYPASSRLS app role.`
    );
  }
}

async function verifyColumns() {
  const rows = await sequelize.query(
    `
      SELECT table_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'organizationId'
        AND table_name IN (${sqlList(TENANT_TABLES)})
    `,
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (rows.length !== TENANT_TABLES.length) {
    throw new Error("One or more tenant tables are missing organizationId.");
  }

  const nullableTables = rows.filter((row) => row.is_nullable !== "NO").map((row) => row.table_name);
  if (nullableTables.length) {
    throw new Error(`Tenant columns must be NOT NULL: ${nullableTables.join(", ")}`);
  }
}

async function verifyRlsCatalog() {
  const rows = await sequelize.query(
    `
      SELECT relname AS table_name, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname IN (${sqlList(RLS_TABLES)})
    `,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const insecureTables = rows
    .filter((row) => !row.relrowsecurity || !row.relforcerowsecurity)
    .map((row) => row.table_name);
  if (insecureTables.length) {
    throw new Error(`RLS is not enabled/forced on: ${insecureTables.join(", ")}`);
  }

  const policies = await sequelize.query(
    `
      SELECT tablename
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (${sqlList(RLS_TABLES)})
    `,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const policyTables = new Set(policies.map((row) => row.tablename));
  const missingPolicies = RLS_TABLES.filter((table) => !policyTables.has(table));
  if (missingPolicies.length) {
    throw new Error(`Missing RLS policies for: ${missingPolicies.join(", ")}`);
  }
}

async function verifyUniqueIndexes() {
  const rows = await sequelize.query(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (${sqlList(REQUIRED_INDEXES)})
    `,
    { type: Sequelize.QueryTypes.SELECT }
  );

  const found = new Set(rows.map((row) => row.indexname));
  const missing = REQUIRED_INDEXES.filter((indexName) => !found.has(indexName));
  if (missing.length) {
    throw new Error(`Missing tenant-scoped unique indexes: ${missing.join(", ")}`);
  }
}

async function run() {
  await sequelize.authenticate();
  await verifyRole();
  await verifyColumns();
  await verifyUniqueIndexes();
  await verifyRlsCatalog();
  await verifyTenantBackfill();
  await verifyRls();
  console.log("Security verification passed");
}

if (require.main === module) {
  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}

module.exports = run;
