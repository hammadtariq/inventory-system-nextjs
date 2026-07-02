"use strict";

const crypto = require("crypto");

const {
  COMPANY_NAME_PREFIXES,
  COMPANY_NAME_SUFFIXES,
  CUSTOMER_FIRST_NAMES,
  CUSTOMER_LAST_NAMES,
  ITEM_NAMES,
  STREET_NAMES_COMPANY,
  STREET_NAMES_CUSTOMER,
  PAYMENT_TYPES_COMPANY,
  PAYMENT_TYPES_CUSTOMER,
} = require("./seed-demo-organization-fixtures");

const DAY_MS = 24 * 60 * 60 * 1000;

// Deterministic PRNG (mulberry32) so re-running the script with the same seed
// produces the same shape of data, which makes local verification reproducible.
function createRng(seed) {
  let state = seed >>> 0;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (rng, min, max, decimals = 2) => Number((rng() * (max - min) + min).toFixed(decimals));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

function pickWeighted(rng, weightedMap) {
  const r = rng();
  let cumulative = 0;
  for (const [key, weight] of Object.entries(weightedMap)) {
    cumulative += weight;
    if (r <= cumulative) return key;
  }
  return Object.keys(weightedMap)[0];
}

function shuffle(rng, arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const randomDateBetween = (rng, start, end) => new Date(start.getTime() + rng() * (end.getTime() - start.getTime()));

const STATUS_WEIGHTS = { APPROVED: 0.7, PENDING: 0.15, CANCEL: 0.15 };
const CHEQUE_STATUS_WEIGHTS = { PASS: 0.55, PENDING: 0.25, RETURN: 0.1, CANCEL: 0.1 };

function generateCompanyNames(rng, count) {
  const combos = new Set();
  const prefixes = shuffle(rng, COMPANY_NAME_PREFIXES);
  const suffixes = shuffle(rng, COMPANY_NAME_SUFFIXES);
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      combos.add(`${prefix} ${suffix}`);
      if (combos.size >= count) return Array.from(combos);
    }
  }
  return Array.from(combos).slice(0, count);
}

function slugifyForEmail(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.+|\.+$)/g, "");
}

// Emails use the RFC 2606 reserved example.com second-level domain, not the bare
// .example TLD — Joi's email validator (pages/api/user/login.js, models via
// isEmail) checks the TLD against a real allow-list and rejects .example.
function generateCompanies(rng, orgSlug, count) {
  const names = generateCompanyNames(rng, count);
  return names.map((companyName) => ({
    uuid: crypto.randomUUID(),
    companyName,
    email: `${slugifyForEmail(companyName)}@${orgSlug}-vendor.example.com`,
    phone: `+1-${randInt(rng, 200, 999)}-${randInt(rng, 200, 999)}-${String(randInt(rng, 0, 9999)).padStart(4, "0")}`,
    address: `${randInt(rng, 100, 9999)} ${pick(rng, STREET_NAMES_COMPANY)}, Unit ${randInt(rng, 1, 40)}`,
  }));
}

function generateCustomers(rng, orgSlug, count) {
  const combos = new Set();
  const firstNames = shuffle(rng, CUSTOMER_FIRST_NAMES);
  const lastNames = shuffle(rng, CUSTOMER_LAST_NAMES);
  outer: for (const first of firstNames) {
    for (const last of lastNames) {
      combos.add(`${first}|${last}`);
      if (combos.size >= count) break outer;
    }
  }
  return Array.from(combos)
    .slice(0, count)
    .map((pair) => {
      const [firstName, lastName] = pair.split("|");
      return {
        uuid: crypto.randomUUID(),
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        email: `${firstName}.${lastName}@${orgSlug}-customer.example.com`,
        phone: `+1-${randInt(rng, 200, 999)}-${randInt(rng, 200, 999)}-${String(randInt(rng, 0, 9999)).padStart(
          4,
          "0"
        )}`,
        address: `${randInt(rng, 100, 9999)} ${pick(rng, STREET_NAMES_CUSTOMER)}, Apt ${randInt(rng, 1, 20)}`,
      };
    });
}

function generateItemsForCompany(rng, company) {
  const itemCount = randInt(rng, 1, 3);
  const names = shuffle(rng, ITEM_NAMES).slice(0, itemCount);
  return names.map((itemName) => {
    const rateStyle = pick(rng, ["lbs", "kgs", "bale"]);
    return {
      uuid: crypto.randomUUID(),
      companyId: company.id,
      itemName,
      type: pick(rng, ["SMALL_BALES", "BIG_BALES"]),
      ratePerLbs: rateStyle === "lbs" ? randFloat(rng, 0.4, 3.5) : null,
      ratePerKgs: rateStyle === "kgs" ? randFloat(rng, 1, 7) : null,
      ratePerBale: rateStyle === "bale" ? randFloat(rng, 40, 400, 0) : null,
    };
  });
}

// Inventory.id is deliberately set equal to the Items.id it was stocked from.
// pages/api/purchase/approve/[id].js's updateInventory() looks up an existing
// Inventory row by { id: product.id, companyId } — where product.id is the
// Items id captured in purchasedProducts at creation time (see
// pages/api/purchase/index.js, which validates purchasedProducts[].id against
// db.Items). If no Inventory row with that id exists yet, approval creates one
// with that same id. Mirroring that here means a demo PENDING purchase can be
// approved live without producing a duplicate/mismatched inventory row.
function generateInventoryForCompany(rng, company, companyItems) {
  return companyItems.map((item) => {
    const noOfBales = randInt(rng, 20, 400);
    return {
      id: item.id,
      uuid: crypto.randomUUID(),
      companyId: company.id,
      itemName: item.itemName,
      noOfBales,
      baleWeightLbs: item.ratePerLbs ? randFloat(rng, 80, 500, 0) : null,
      baleWeightKgs: item.ratePerKgs ? randFloat(rng, 40, 220, 0) : null,
      ratePerLbs: item.ratePerLbs,
      ratePerKgs: item.ratePerKgs,
      ratePerBale: item.ratePerBale,
      // Floored well above typical sale draw sizes (1-20 bales, see generateSale)
      // so a demo PENDING sale can be approved live without hitting the
      // "out of stock" 404 that pages/api/sales/approve/[id].js throws when
      // onHand < noOfBales.
      onHand: randInt(rng, Math.min(50, noOfBales), noOfBales),
    };
  });
}

function productLineTotal(product) {
  const rate = product.ratePerBale || product.ratePerKgs || product.ratePerLbs || 1;
  return rate * product.noOfBales;
}

function generatePurchase(rng, company, companyItems, dateRange, invoiceCounter) {
  const productCount = randInt(rng, 1, Math.min(3, companyItems.length));
  const products = shuffle(rng, companyItems)
    .slice(0, productCount)
    .map((item) => ({
      id: item.id,
      itemName: item.itemName,
      noOfBales: randInt(rng, 5, 60),
      ratePerLbs: item.ratePerLbs,
      ratePerKgs: item.ratePerKgs,
      ratePerBale: item.ratePerBale,
    }));
  const totalAmount = products.reduce((sum, p) => sum + productLineTotal(p), 0);

  return {
    uuid: crypto.randomUUID(),
    companyId: company.id,
    totalAmount: Number(totalAmount.toFixed(2)),
    surCharge: rng() < 0.3 ? randFloat(rng, 10, 150) : null,
    invoiceNumber: `PINV-${invoiceCounter}`,
    purchasedProducts: JSON.stringify(products),
    revisionDetails: null,
    revisionNo: 0,
    status: pickWeighted(rng, STATUS_WEIGHTS),
    baleType: pick(rng, ["SMALL_BALES", "BIG_BALES"]),
    purchaseDate: randomDateBetween(rng, dateRange.start, dateRange.end),
  };
}

function generateSale(rng, customer, inventoryPool, dateRange) {
  const productCount = randInt(rng, 1, 3);
  const products = shuffle(rng, inventoryPool)
    .slice(0, productCount)
    .map((inv) => ({
      id: inv.id,
      companyId: inv.companyId,
      itemName: inv.itemName,
      noOfBales: randInt(rng, 1, 20),
      ratePerLbs: inv.ratePerLbs,
      ratePerKgs: inv.ratePerKgs,
      ratePerBale: inv.ratePerBale,
      baleWeightLbs: inv.baleWeightLbs,
      baleWeightKgs: inv.baleWeightKgs,
    }));
  const totalAmount = products.reduce((sum, p) => sum + productLineTotal(p), 0);

  return {
    uuid: crypto.randomUUID(),
    customerId: customer.id,
    laborCharge: rng() < 0.4 ? randFloat(rng, 5, 60) : 0,
    totalAmount: Number(totalAmount.toFixed(2)),
    soldProducts: JSON.stringify(products),
    status: pickWeighted(rng, STATUS_WEIGHTS),
    soldDate: randomDateBetween(rng, dateRange.start, dateRange.end),
  };
}

// Builds ledger rows (CREDIT/DEBIT) tied to approved purchases and sales, plus
// synthetic CASH/ONLINE/CHEQUE/REFUND payments layered on top, and the matching
// Cheque rows for any payment that used paymentType "CHEQUE". Running balances
// are computed chronologically per company/customer using the same signed
// convention as query/index.js's companySumQuery/customerSumQuery, so the demo
// ledger history reads as plausible even though the live SUM query is what the
// UI actually displays.
function buildLedgerAndCheques(rng, { companies, customers, purchases, sales }) {
  const companyEvents = new Map(companies.map((c) => [c.id, []]));
  const customerEvents = new Map(customers.map((c) => [c.id, []]));

  purchases
    .filter((p) => p.status === "APPROVED")
    .forEach((p) => {
      companyEvents.get(p.companyId).push({
        date: new Date(p.purchaseDate),
        kind: "purchase",
        amount: p.totalAmount,
        transactionId: p.id,
        invoiceNumber: p.invoiceNumber,
      });
    });

  sales
    .filter((s) => s.status === "APPROVED")
    .forEach((s) => {
      customerEvents.get(s.customerId).push({
        date: new Date(s.soldDate),
        kind: "sale",
        amount: s.totalAmount,
        transactionId: s.id,
        invoiceNumber: String(s.id),
      });
    });

  let chequeCounter = 1000;
  const addSyntheticPayments = (eventsByEntity, paymentTypes) => {
    eventsByEntity.forEach((events) => {
      if (!events.length || rng() > 0.5) return;
      const paymentCount = randInt(rng, 1, 3);
      for (let i = 0; i < paymentCount; i++) {
        const anchor = pick(rng, events);
        const paymentDate = new Date(anchor.date.getTime() + randInt(rng, 1, 20) * DAY_MS);
        const paymentType = pick(rng, paymentTypes);
        const event = {
          date: paymentDate,
          kind: "payment",
          amount: randFloat(rng, 50, Math.max(anchor.amount, 60), 2),
          paymentType,
        };
        if (paymentType === "CHEQUE") {
          chequeCounter += 1;
          event.chequeId = `CHQ-${chequeCounter}`;
          event.dueDate = new Date(paymentDate.getTime() + randInt(rng, 3, 30) * DAY_MS);
          event.chequeStatus = pickWeighted(rng, CHEQUE_STATUS_WEIGHTS);
        }
        events.push(event);
      }
    });
  };

  addSyntheticPayments(companyEvents, PAYMENT_TYPES_COMPANY);
  addSyntheticPayments(customerEvents, PAYMENT_TYPES_CUSTOMER);

  const ledgerRows = [];
  const chequeRows = [];

  companyEvents.forEach((events, companyId) => {
    let balance = 0;
    events
      .slice()
      .sort((a, b) => a.date - b.date)
      .forEach((event) => {
        if (event.kind === "purchase") {
          balance += event.amount;
          ledgerRows.push({
            companyId,
            customerId: null,
            spendType: "DEBIT",
            amount: event.amount,
            paymentType: null,
            invoiceNumber: event.invoiceNumber,
            transactionId: event.transactionId,
            paymentDate: event.date,
            totalBalance: balance,
            companyTotal: null,
            customerTotal: null,
            reference: null,
            otherName: null,
          });
          return;
        }

        balance -= event.amount;
        ledgerRows.push({
          companyId,
          customerId: null,
          spendType: "DEBIT",
          amount: event.amount,
          paymentType: event.paymentType,
          invoiceNumber: null,
          transactionId: null,
          paymentDate: event.date,
          totalBalance: balance,
          companyTotal: balance,
          customerTotal: null,
          reference: event.chequeId || null,
          otherName: null,
        });
        if (event.paymentType === "CHEQUE") {
          chequeRows.push({ chequeId: event.chequeId, dueDate: event.dueDate, status: event.chequeStatus });
        }
      });
  });

  customerEvents.forEach((events, customerId) => {
    let balance = 0;
    events
      .slice()
      .sort((a, b) => a.date - b.date)
      .forEach((event) => {
        if (event.kind === "sale") {
          balance -= event.amount;
          ledgerRows.push({
            companyId: null,
            customerId,
            spendType: "CREDIT",
            amount: event.amount,
            paymentType: null,
            invoiceNumber: event.invoiceNumber,
            transactionId: event.transactionId,
            paymentDate: event.date,
            totalBalance: balance,
            companyTotal: null,
            customerTotal: null,
            reference: null,
            otherName: null,
          });
          return;
        }

        balance += event.paymentType === "REFUND" ? -event.amount : event.amount;
        ledgerRows.push({
          companyId: null,
          customerId,
          spendType: event.paymentType === "REFUND" ? "CREDIT" : "DEBIT",
          amount: event.amount,
          paymentType: event.paymentType,
          invoiceNumber: null,
          transactionId: null,
          paymentDate: event.date,
          totalBalance: balance,
          companyTotal: null,
          customerTotal: balance,
          reference: event.chequeId || null,
          otherName: null,
        });
        if (event.paymentType === "CHEQUE") {
          chequeRows.push({ chequeId: event.chequeId, dueDate: event.dueDate, status: event.chequeStatus });
        }
      });
  });

  return { ledgerRows, chequeRows };
}

module.exports = {
  createRng,
  randInt,
  randFloat,
  pick,
  pickWeighted,
  shuffle,
  randomDateBetween,
  generateCompanies,
  generateCustomers,
  generateItemsForCompany,
  generateInventoryForCompany,
  generatePurchase,
  generateSale,
  buildLedgerAndCheques,
};
