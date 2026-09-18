"use strict";

require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const {
  createRng,
  pick,
  generateCompanies,
  generateCustomers,
  generateItemsForCompany,
  generateInventoryForCompany,
  generatePurchase,
  generateSale,
  buildLedgerAndCheques,
} = require("./seed-demo-organization-generator");

const ORG_NAME = "Drift Warehouse Demo";
const ORG_SLUG = "drift-warehouse-demo";
const COMPANY_COUNT = 55;
const CUSTOMER_COUNT = 55;
const PURCHASE_COUNT = 320;
const SALE_COUNT = 320;
const MONTHS_BACK = 12;
const SEED = 88171;

// Kept in one place: which tables belong to this org's demo data (deleted and
// regenerated on every run) versus the org/user rows (upserted, never deleted).
const WIPE_TABLES_IN_ORDER = [
  "cheques",
  "ledgers",
  "saleReturns",
  "sales",
  "purchase_histories",
  "purchases",
  "items",
  "inventories",
  "customers",
  "companies",
];

// 3 demo logins: 1 ADMIN, 2 EDITOR with different working scopes (warehouse/purchasing
// vs. sales), matching the two-role model in data/permission.js. Emails are short,
// role-based, and easy to type/remember live in front of a prospect — not meant to
// look like a real person's address (unlike the bulk company/customer records).
const DEMO_USERS = [
  {
    envPrefix: "DEMO_ADMIN",
    firstName: "amina",
    lastName: "rahman",
    email: "admin@trs.com",
    role: "ADMIN",
    scopeLabel: "org admin",
  },
  {
    envPrefix: "DEMO_EDITOR_WAREHOUSE",
    firstName: "farhan",
    lastName: "aziz",
    email: "warehouse@trs.com",
    role: "EDITOR",
    scopeLabel: "warehouse / purchasing",
  },
  {
    envPrefix: "DEMO_EDITOR_SALES",
    firstName: "sara",
    lastName: "khan",
    email: "sales@trs.com",
    role: "EDITOR",
    scopeLabel: "sales",
  },
];

const randomPassword = () => crypto.randomBytes(12).toString("base64url");

async function upsertOrganization(sequelize) {
  const [organization] = await sequelize.query(
    `
      INSERT INTO organizations (uuid, name, slug, plan, status, "maxUsers", "createdAt", "updatedAt")
      VALUES (:uuid, :name, :slug, 'PRO', 'ACTIVE', 10, NOW(), NOW())
      ON CONFLICT (slug)
      DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
      RETURNING id, uuid, name, slug;
    `,
    {
      replacements: { uuid: crypto.randomUUID(), name: ORG_NAME, slug: ORG_SLUG },
      type: Sequelize.QueryTypes.SELECT,
    }
  );
  return organization;
}

async function upsertDemoUsers(sequelize, organizationId) {
  const credentials = [];

  for (const spec of DEMO_USERS) {
    const existing = await sequelize.query(`SELECT id FROM users WHERE email = :email`, {
      replacements: { email: spec.email },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (existing.length) {
      credentials.push({
        role: spec.role,
        scope: spec.scopeLabel,
        email: spec.email,
        password: "(unchanged — user already exists, password not reset)",
      });
      continue;
    }

    const password = process.env[`${spec.envPrefix}_PASSWORD`] || randomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await sequelize.query(
      `
        INSERT INTO users
          (uuid, "firstName", "lastName", email, password, role, "organizationId", status, "acceptedAt", "createdAt", "updatedAt")
        VALUES
          (:uuid, :firstName, :lastName, :email, :password, :role, :organizationId, 'ACTIVE', NOW(), NOW(), NOW());
      `,
      {
        replacements: {
          uuid: crypto.randomUUID(),
          firstName: spec.firstName,
          lastName: spec.lastName,
          email: spec.email,
          password: passwordHash,
          role: spec.role,
          organizationId,
        },
      }
    );

    credentials.push({ role: spec.role, scope: spec.scopeLabel, email: spec.email, password });
  }

  return credentials;
}

async function wipeExistingDemoData(sequelize, transaction, organizationId) {
  for (const table of WIPE_TABLES_IN_ORDER) {
    await sequelize.query(`DELETE FROM "${table}" WHERE "organizationId" = :organizationId`, {
      transaction,
      replacements: { organizationId },
    });
  }
}

function withTenantColumns(rows, organizationId, now) {
  return rows.map((row) => ({ ...row, organizationId, createdAt: now, updatedAt: now }));
}

async function seedBulkData(sequelize, transaction, organizationId) {
  const qi = sequelize.getQueryInterface();
  const rng = createRng(SEED);
  const now = new Date();
  const dateRange = { start: new Date(now.getTime() - MONTHS_BACK * 30 * 24 * 60 * 60 * 1000), end: now };

  const companies = await qi.bulkInsert(
    "companies",
    withTenantColumns(generateCompanies(rng, ORG_SLUG, COMPANY_COUNT), organizationId, now),
    { transaction, returning: true }
  );

  const customers = await qi.bulkInsert(
    "customers",
    withTenantColumns(generateCustomers(rng, ORG_SLUG, CUSTOMER_COUNT), organizationId, now),
    { transaction, returning: true }
  );

  const itemRows = [];
  companies.forEach((company) => {
    itemRows.push(...generateItemsForCompany(rng, company));
  });
  const items = await qi.bulkInsert("items", withTenantColumns(itemRows, organizationId, now), {
    transaction,
    returning: true,
  });

  const inventoryRows = [];
  companies.forEach((company) => {
    const companyItems = items.filter((item) => item.companyId === company.id);
    inventoryRows.push(...generateInventoryForCompany(rng, company, companyItems));
  });
  const inventories = await qi.bulkInsert("inventories", withTenantColumns(inventoryRows, organizationId, now), {
    transaction,
    returning: true,
  });
  // Inventory rows above were inserted with explicit ids (mirroring Items.id — see
  // generateInventoryForCompany), so the id sequence needs bumping past our high
  // watermark or the next ORM-created Inventory row (e.g. a live "Approve" on a
  // genuinely new item) would collide with one of these ids.
  await sequelize.query(
    `SELECT setval(pg_get_serial_sequence('inventories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM inventories));`,
    { transaction }
  );

  const purchaseRows = [];
  let purchaseInvoiceCounter = 1000;
  for (let i = 0; i < PURCHASE_COUNT; i++) {
    const company = pick(rng, companies);
    const companyItems = items.filter((item) => item.companyId === company.id);
    if (!companyItems.length) continue;
    purchaseInvoiceCounter += 1;
    purchaseRows.push(generatePurchase(rng, company, companyItems, dateRange, purchaseInvoiceCounter));
  }
  const purchases = await qi.bulkInsert("purchases", withTenantColumns(purchaseRows, organizationId, now), {
    transaction,
    returning: true,
  });

  const saleRows = [];
  for (let i = 0; i < SALE_COUNT; i++) {
    const customer = pick(rng, customers);
    saleRows.push(generateSale(rng, customer, inventories, dateRange));
  }
  const sales = await qi.bulkInsert("sales", withTenantColumns(saleRows, organizationId, now), {
    transaction,
    returning: true,
  });

  const { ledgerRows, chequeRows } = buildLedgerAndCheques(rng, { companies, customers, purchases, sales });
  await qi.bulkInsert("ledgers", withTenantColumns(ledgerRows, organizationId, now), { transaction });
  await qi.bulkInsert("cheques", withTenantColumns(chequeRows, organizationId, now), { transaction });

  return {
    companies: companies.length,
    customers: customers.length,
    items: items.length,
    inventories: inventories.length,
    purchases: purchases.length,
    sales: sales.length,
    ledgers: ledgerRows.length,
    cheques: chequeRows.length,
  };
}

async function run() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  try {
    await sequelize.authenticate();

    const organization = await upsertOrganization(sequelize);
    const credentials = await upsertDemoUsers(sequelize, organization.id);

    const created = await sequelize.transaction(async (transaction) => {
      // Defense-in-depth: matches the SET LOCAL app.tenant_id pattern the app itself
      // uses (middlewares/auth.js, lib/tenant-transaction.js) so this script behaves
      // the same under RLS whether or not the connecting role bypasses it.
      await sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
        transaction,
        replacements: { organizationId: organization.id },
      });

      await wipeExistingDemoData(sequelize, transaction, organization.id);
      return seedBulkData(sequelize, transaction, organization.id);
    });

    console.log("\nDemo organization seeded successfully.\n");
    console.log("Organization:", { id: organization.id, name: organization.name, slug: organization.slug });
    console.table(created);

    console.log("\nDemo logins (copy these now — passwords are only printed once, never stored in the repo):\n");
    credentials.forEach((c) => console.log(`  [${c.role}] ${c.scope.padEnd(20)} ${c.email}  /  ${c.password}`));
    console.log("\nStore these in your team password manager or as Vercel env vars, not in git.\n");
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = run;
