"use strict";

require("dotenv").config();

const Sequelize = require("sequelize");

const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

// Every table with an autoincrement "id" that can drift behind the real data —
// e.g. after a bulk import/restore that inserts explicit ids without calling
// setval() (see CLAUDE.md's "Production data imported from
// inventory_backup_20_06_26" deployment note). Most of these are RLS-protected
// (migrations/20260430120000-enable-row-level-security.js), so MAX(id) has to be
// checked per organization with app.tenant_id set, or it silently reports 0 rows
// for every tenant. "users" and "organizations" aren't RLS-protected but are
// included for completeness (organizations has no "id" drift risk in practice
// since it's only ever written through this app, but checking costs nothing).
const TABLES = [
  "users",
  "organizations",
  "companies",
  "customers",
  "items",
  "inventories",
  "purchases",
  "purchase_histories",
  "sales",
  "saleReturns",
  "ledgers",
  "cheques",
];

const APPLY = process.argv.includes("--apply");

async function getSequenceName(sequelize, table) {
  // pg_get_serial_sequence's table-name argument goes through the same
  // identifier-folding rules as a ::regclass cast — an unquoted "saleReturns"
  // gets folded to lowercase and fails to resolve. Quoting it here (safe for
  // every table, mixed-case or not) preserves the real stored name.
  const rows = await sequelize.query(`SELECT pg_get_serial_sequence(:table, 'id') AS seq`, {
    replacements: { table: `"${table}"` },
    type: Sequelize.QueryTypes.SELECT,
  });
  return rows[0].seq;
}

async function getSequenceCurrentValue(sequelize, sequenceName) {
  const rows = await sequelize.query(`SELECT last_value FROM ${sequenceName}`, {
    type: Sequelize.QueryTypes.SELECT,
  });
  return Number(rows[0].last_value);
}

async function getRealMaxId(sequelize, table, organizations) {
  let realMax = 0;

  for (const org of organizations) {
    const maxForOrg = await sequelize.transaction(async (transaction) => {
      await sequelize.query("SET LOCAL app.tenant_id = :orgId", {
        transaction,
        replacements: { orgId: org.id },
      });
      const rows = await sequelize.query(`SELECT COALESCE(MAX(id), 0) AS m FROM "${table}"`, {
        transaction,
        type: Sequelize.QueryTypes.SELECT,
      });
      return Number(rows[0].m);
    });
    if (maxForOrg > realMax) realMax = maxForOrg;
  }

  return realMax;
}

async function run() {
  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  try {
    await sequelize.authenticate();
    console.log(
      `Connected to ${config.host}/${config.database} (${APPLY ? "APPLY" : "DRY RUN — pass --apply to fix"})`
    );

    const organizations = await sequelize.query(`SELECT id, slug FROM organizations`, {
      type: Sequelize.QueryTypes.SELECT,
    });

    if (!organizations.length) {
      console.log("No organizations found — nothing to check.");
      return;
    }

    const report = [];

    for (const table of TABLES) {
      const sequenceName = await getSequenceName(sequelize, table);
      const currentValue = await getSequenceCurrentValue(sequelize, sequenceName);
      const realMax = await getRealMaxId(sequelize, table, organizations);

      const behind = realMax > currentValue;
      report.push({ table, sequenceName, currentValue, realMaxId: realMax, behind });

      if (behind && APPLY) {
        await sequelize.query(`SELECT setval(:seq, :value)`, {
          replacements: { seq: sequenceName, value: realMax },
        });
      }
    }

    console.table(report);

    const staleCount = report.filter((row) => row.behind).length;
    if (!staleCount) {
      console.log("All sequences already match the real data — nothing to do.");
    } else if (APPLY) {
      console.log(`Fixed ${staleCount} sequence(s) that were behind.`);
    } else {
      console.log(`${staleCount} sequence(s) are behind the real data. Re-run with --apply to fix them.`);
    }
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
