"use strict";

// One-off repair for the customer ledger sign bug fixed in PR #264.
//
// createLedgerPayment (lib/ledger.js) stored the per-row customerTotal with the wrong sign for
// customerId-only entries: refunds were added instead of subtracted, and sale returns / cash
// were subtracted instead of added. The ledger page shows customerTotal as the row's Balance,
// so those rows disagree with the page's Total Balance (customerSumQuery).
//
// For every legacy customer row that went through that code path, this script recomputes the
// balance the row should have stored: the customer's balance from all earlier rows (by id,
// which is creation order, i.e. what balanceQuery saw at the time) plus this row's own effect,
// using the same rules as customerSumQuery in query/index.js.
//
// Only rows whose stored value is off by exactly the sign flip (2 x amount, in the direction
// the bug produced) are updated. Any other mismatch is listed as "other drift" for a person to
// look at; the script never changes those.
//
// Usage:
//   node scripts/repair-customer-ledger-balances.js                 # dry run, all orgs
//   node scripts/repair-customer-ledger-balances.js --org 3         # dry run, one org
//   node scripts/repair-customer-ledger-balances.js --ledger 18002  # dry run, one row
//   node scripts/repair-customer-ledger-balances.js --org 1 --ledger 18002 --apply  # fix that row
//
// --apply only ever fixes the one row named by --ledger, and only if it is a sign-bug row.
//
// Every run writes a CSV of the rows it found (dry run) or changed (apply, written before each
// org's update), with old and new values, so the change can be reversed.

const fs = require("fs");
const path = require("path");

const CASH_LIKE_PAYMENT_TYPES = new Set(["CASH", "ONLINE", "CHEQUE"]);
const MONEY_EPSILON = 0.005;

const hasRoleColumns = (row) =>
  Boolean(row.payToCompanyId || row.payToCustomerId || row.payByCompanyId || row.payByCustomerId);

// Mirrors the legacy CASE in customerSumQuery and computeEntryDelta("customer", ...) in
// utils/ledger-balance.util.js (a unit test keeps the two in step).
const legacyCustomerDelta = (paymentType, spendType, amount) => {
  if (paymentType === "REFUND") return -amount;
  if (CASH_LIKE_PAYMENT_TYPES.has(paymentType) || paymentType === "INVENTORY_RETURN") return amount;
  if (spendType === "DEBIT") return amount;
  if (spendType === "CREDIT") return -amount;
  return 0;
};

// How one ledger row moves customer `customerId`'s balance, exactly as customerSumQuery sums it.
const customerDelta = (row, customerId) => {
  const amount = Number(row.amount);
  if (!hasRoleColumns(row)) {
    return Number(row.customerId) === customerId ? legacyCustomerDelta(row.paymentType, row.spendType, amount) : 0;
  }
  if (Number(row.payToCustomerId) === customerId) return -amount;
  if (Number(row.payByCustomerId) === customerId) return amount;
  return 0;
};

// Rows whose customerTotal was written by the buggy branch of createLedgerPayment and is what
// the page displays: legacy shape, customerId set, paymentType set, customerTotal stored.
const isRepairCandidate = (row) =>
  !hasRoleColumns(row) && row.customerId != null && Boolean(row.paymentType) && row.customerTotal != null;

// The buggy code stored prior + amount for REFUND and prior - amount for everything else.
const buggyDelta = (row) => (row.paymentType === "REFUND" ? Number(row.amount) : -Number(row.amount));

const roundMoney = (value) => Math.round(value * 100) / 100;

// rows: every ledger row of one organization that touches a customer, ordered by id.
// Returns one finding per repair candidate whose stored balance is wrong.
const findMismatches = (rows) => {
  const customerIds = new Set();
  for (const row of rows) {
    for (const id of [row.customerId, row.payToCustomerId, row.payByCustomerId]) {
      if (id != null) customerIds.add(Number(id));
    }
  }

  const findings = [];
  for (const customerId of customerIds) {
    let balance = 0;
    for (const row of rows) {
      const delta = customerDelta(row, customerId);
      const priorBalance = balance;
      balance += delta;

      if (!isRepairCandidate(row) || Number(row.customerId) !== customerId) continue;

      const stored = Number(row.customerTotal);
      const expected = roundMoney(priorBalance + delta);
      const difference = roundMoney(stored - expected);
      if (Math.abs(difference) < MONEY_EPSILON) continue;

      // What the buggy code would have stored on top of the same prior balance.
      const signBugDifference = roundMoney(buggyDelta(row) - delta);
      const kind = Math.abs(difference - signBugDifference) < MONEY_EPSILON ? "sign-bug" : "other drift";

      findings.push({
        organizationId: row.organizationId,
        customerId,
        ledgerId: row.id,
        paymentDate: row.paymentDate ? new Date(row.paymentDate).toISOString().slice(0, 10) : "",
        paymentType: row.paymentType,
        amount: Number(row.amount),
        storedCustomerTotal: stored,
        correctCustomerTotal: expected,
        difference,
        kind,
      });
    }
  }

  return findings.sort((a, b) => a.ledgerId - b.ledgerId);
};

const parseArgs = (argv) => {
  const args = { apply: false, org: null, ledger: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--apply") args.apply = true;
    else if (argv[i] === "--org" || argv[i] === "--ledger") {
      const key = argv[i].slice(2);
      args[key] = Number(argv[i + 1]);
      i += 1;
      if (!Number.isInteger(args[key])) throw new Error(`--${key} needs a numeric id`);
    } else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  // Repairs are deliberate, one row at a time: the dry run lists candidates, a person picks.
  if (args.apply && args.ledger === null) throw new Error("--apply needs --ledger <id>");
  return args;
};

const CSV_COLUMNS = [
  "organizationId",
  "customerId",
  "ledgerId",
  "paymentDate",
  "paymentType",
  "amount",
  "storedCustomerTotal",
  "correctCustomerTotal",
  "difference",
  "kind",
];

const toCsvRows = (findings) => findings.map((f) => CSV_COLUMNS.map((c) => f[c]).join(",") + "\n").join("");

async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const Sequelize = require("sequelize");
  const env = process.env.NODE_ENV || "development";
  const config = require("../config/config.js")[env];
  const sequelize = new Sequelize(config.database, config.username, config.password, { ...config, logging: false });

  try {
    await sequelize.authenticate();
    console.log(`Database: ${config.host}/${config.database} (${env})`);
    console.log(args.apply ? "Mode: APPLY (changes will be written)" : "Mode: dry run (nothing is written)");

    const [organizations] = await sequelize.query(
      args.org
        ? `SELECT id FROM organizations WHERE id = :org ORDER BY id`
        : `SELECT id FROM organizations ORDER BY id`,
      { replacements: { org: args.org } }
    );

    // In apply mode, each org's rows are written here before they are updated, so the file is a
    // complete record of old values even if a later org fails. It holds ledger data: owner-only
    // permissions, gitignored (ledger-balance-repair-*.csv), and the run ends with a reminder.
    const csvPath = path.resolve(
      `ledger-balance-repair-${args.apply ? "applied" : "dry-run"}-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.csv`
    );
    fs.writeFileSync(csvPath, CSV_COLUMNS.join(",") + "\n", { mode: 0o600 });

    const allFindings = [];
    const applied = [];

    for (const { id: organizationId } of organizations) {
      await sequelize.transaction(async (transaction) => {
        await sequelize.query("SET LOCAL app.tenant_id = :organizationId", {
          transaction,
          replacements: { organizationId },
        });

        const [rows] = await sequelize.query(
          `SELECT id, "organizationId", "customerId", "payToCustomerId", "payByCustomerId",
                  "payToCompanyId", "payByCompanyId", "paymentType", "spendType", amount,
                  "customerTotal", "paymentDate"
             FROM ledgers
            WHERE "organizationId" = :organizationId
              AND ("customerId" IS NOT NULL OR "payToCustomerId" IS NOT NULL OR "payByCustomerId" IS NOT NULL)
            ORDER BY id`,
          { transaction, replacements: { organizationId } }
        );

        const findings = findMismatches(rows).filter((f) => args.ledger === null || f.ledgerId === args.ledger);
        allFindings.push(...findings);

        if (!args.apply) {
          fs.appendFileSync(csvPath, toCsvRows(findings));
          return;
        }

        const repairs = findings.filter((f) => f.kind === "sign-bug");
        fs.appendFileSync(csvPath, toCsvRows(repairs));

        for (const finding of repairs) {
          const [, result] = await sequelize.query(
            `UPDATE ledgers SET "customerTotal" = :correct, "updatedAt" = NOW()
              WHERE id = :ledgerId AND "organizationId" = :organizationId AND "customerTotal" = :stored`,
            {
              transaction,
              replacements: {
                correct: finding.correctCustomerTotal,
                ledgerId: finding.ledgerId,
                organizationId,
                stored: finding.storedCustomerTotal,
              },
            }
          );
          if (result.rowCount !== 1) {
            throw new Error(`Ledger ${finding.ledgerId} changed while repairing; rolled back org ${organizationId}`);
          }
          applied.push(finding);
        }
      });
    }

    if (!allFindings.length) {
      fs.unlinkSync(csvPath);
      console.log(
        args.ledger === null
          ? "No customer ledger rows with a wrong stored balance."
          : `Ledger ${args.ledger} is not a customer row with a wrong stored balance; nothing to do.`
      );
      return { findings: [], applied: [] };
    }

    console.table(
      allFindings.map(
        ({
          organizationId,
          customerId,
          ledgerId,
          paymentDate,
          paymentType,
          amount,
          storedCustomerTotal,
          correctCustomerTotal,
          kind,
        }) => ({
          org: organizationId,
          customer: customerId,
          ledger: ledgerId,
          date: paymentDate,
          type: paymentType,
          amount,
          stored: storedCustomerTotal,
          correct: correctCustomerTotal,
          kind,
        })
      )
    );

    const signBug = allFindings.filter((f) => f.kind === "sign-bug");
    const otherDrift = allFindings.filter((f) => f.kind === "other drift");
    console.log(`Sign-bug rows: ${signBug.length}. Other drift (not changed, review by hand): ${otherDrift.length}.`);

    console.log(`${args.apply ? `Updated ${applied.length} rows. Old and new values` : "Report"} saved to ${csvPath}`);
    console.log(
      "This file contains customer ledger data. Keep it off shared hosts and delete it once it's no longer needed."
    );

    return { findings: allFindings, applied };
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

module.exports = { run, findMismatches, customerDelta, legacyCustomerDelta, parseArgs };
