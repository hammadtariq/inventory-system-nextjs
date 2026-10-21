import { randomUUID } from "node:crypto";
import { Client } from "pg";

/**
 * A second organization for tenant-isolation tests (C58, C59). The demo seed creates one org and
 * registering another needs a SUPER_ADMIN, so tests write the other org's rows straight into the
 * local test database (the same POSTGRES_* settings the app uses), inside a transaction with
 * `app.tenant_id` set so row-level security applies. Never point this at production.
 */

export type OtherOrg = {
  organizationId: number;
  companyId: number;
  itemId: number;
  itemName: string;
  purchaseId: number;
};

function client() {
  const host = process.env.POSTGRES_HOST || "localhost";
  if (host.includes("supabase.co")) throw new Error("second-org.ts must only run against a local test database");
  return new Client({
    host,
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "inventory-management-local",
  });
}

/** Run `fn` in a transaction scoped to `organizationId` (as the app does per request). */
export async function asTenant<T>(organizationId: number, fn: (db: Client) => Promise<T>): Promise<T> {
  const db = client();
  await db.connect();
  try {
    await db.query("BEGIN");
    await db.query("SELECT set_config('app.tenant_id', $1, true)", [String(organizationId)]);
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
    await db.end();
  }
}

/** Create a fresh organization with a company, a BIG_BALES item and a PENDING purchase Z of it. */
export async function createOtherOrg(tag: string): Promise<OtherOrg> {
  const slug = `qa-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase();
  const db = client();
  await db.connect();
  let organizationId: number;
  try {
    const org = await db.query(
      `INSERT INTO organizations (uuid, name, slug, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [randomUUID(), `QA isolation ${slug}`, slug]
    );
    organizationId = org.rows[0].id;
  } finally {
    await db.end();
  }

  return asTenant(organizationId, async (tx) => {
    const company = await tx.query(
      `INSERT INTO companies ("companyName", uuid, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [`qa other supplier ${slug}`, randomUUID(), organizationId]
    );
    const companyId = company.rows[0].id;
    const itemName = `qa other item ${slug}`;
    const item = await tx.query(
      `INSERT INTO items ("itemName", "companyId", type, "ratePerKgs", uuid, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, 'BIG_BALES', 10, $3, $4, NOW(), NOW()) RETURNING id`,
      [itemName, companyId, randomUUID(), organizationId]
    );
    const itemId = item.rows[0].id;
    const products = [{ id: itemId, itemName, noOfBales: 4, baleWeightKgs: 10, ratePerKgs: 10 }];
    const purchase = await tx.query(
      `INSERT INTO purchases ("companyId", "totalAmount", "purchasedProducts", "baleType", status, "invoiceNumber",
         uuid, "purchaseDate", "organizationId", "revisionNo", "createdAt", "updatedAt")
       VALUES ($1, 400, $2, 'BIG_BALES', 'PENDING', $3, $4, NOW(), $5, 0, NOW(), NOW()) RETURNING id`,
      [companyId, JSON.stringify(products), `qa-other-${slug}`, randomUUID(), organizationId]
    );
    return { organizationId, companyId, itemId, itemName, purchaseId: purchase.rows[0].id };
  });
}

/** The other org's view of its own data: purchase Z, its stock rows and ledger entries. */
export async function otherOrgSnapshot(org: OtherOrg) {
  return asTenant(org.organizationId, async (tx) => {
    const purchase = await tx.query(
      `SELECT status, "totalAmount", "purchasedProducts", "companyId", "revisionNo" FROM purchases WHERE id = $1`,
      [org.purchaseId]
    );
    const stock = await tx.query(`SELECT id, "onHand" FROM inventories ORDER BY id`);
    const ledger = await tx.query(`SELECT id, amount, "totalBalance" FROM ledgers ORDER BY id`);
    return { purchase: purchase.rows[0], stock: stock.rows, ledger: ledger.rows };
  });
}

/** Stock rows in `organizationId` keyed by `itemId` (used to detect a foreign item leaking in). */
export async function stockRowsFor(organizationId: number, itemId: number) {
  return asTenant(organizationId, async (tx) => {
    const rows = await tx.query(`SELECT id, "onHand", "companyId" FROM inventories WHERE id = $1`, [itemId]);
    return rows.rows;
  });
}
