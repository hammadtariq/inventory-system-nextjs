import {
  expect,
  test,
  request as playwrightRequest,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from "@playwright/test";

/**
 * API helpers for purchase-order tests (specs/purchase-orders.md). Tests create their own data
 * through these with unique names, read before-values, act, then assert exact new values.
 * `api` is the `request` fixture (signed in as the demo ADMIN) or a context from `loginAs`.
 */

/**
 * Known bugs (specs/purchase-orders.md, qa:gate-4 issues). A case that fails only because of a known bug
 * starts with `test.fixme(!po.runKnownBugs, "Known bug #N: ...")`; a known-bug row or step inside an
 * otherwise healthy case runs only when `po.runKnownBugs`, after `po.knownBug("#N", ...)` records it.
 * Run `QA_RUN_KNOWN_BUGS=1 npx playwright test e2e/purchase` to check whether a fix has landed.
 * The assertions are never weakened: they are the business rule.
 */
export const runKnownBugs = process.env.QA_RUN_KNOWN_BUGS === "1";

/** Record a known-bug row or step in the report; returns whether to run it. */
export function knownBug(issue: string, what: string) {
  test.info().annotations.push({ type: "known-bug", description: `${issue}: ${what}` });
  return runKnownBugs;
}

export type BaleType = "SMALL_BALES" | "BIG_BALES";

export type Line = {
  id: number;
  itemName: string;
  noOfBales: number;
  baleWeightKgs?: number | null;
  baleWeightLbs?: number | null;
  ratePerKgs?: number | null;
  ratePerLbs?: number | null;
  ratePerBale?: number | null;
};

export type Item = { id: number; itemName: string; companyId: number; type: BaleType };

export type Purchase = {
  id: number;
  companyId: number;
  baleType: BaleType;
  status: "PENDING" | "APPROVED" | "CANCEL";
  totalAmount: number;
  surCharge: number | null;
  invoiceNumber: string | null;
  revisionNo: number;
  revisionDetails: any;
  purchaseDate: string;
  purchasedProducts: Line[];
};

export type LedgerRow = {
  id: number;
  amount: number;
  spendType: string;
  paymentType: string | null;
  transactionId: number | null;
  paymentDate: string;
  totalBalance: number;
  partyBalance: number;
  runningBalance: number;
};

/** A name unique to this run and worker, e.g. "qa-po-c12-lq2x9a-3f". */
export const uid = (tag: string) =>
  `qa-po-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toLowerCase();

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Business rule: weight line = bales × weight per bale × rate; bale line = bales × rate per bale. */
export const lineTotal = (l: Line) => {
  if (l.ratePerKgs && l.baleWeightKgs) return round2(l.noOfBales * l.baleWeightKgs * l.ratePerKgs);
  if (l.ratePerLbs && l.baleWeightLbs) return round2(l.noOfBales * l.baleWeightLbs * l.ratePerLbs);
  return round2(l.noOfBales * (l.ratePerBale ?? 0));
};

/** Purchase total: every line plus the surcharge once. */
export const purchaseTotal = (lines: Line[], surCharge = 0) =>
  round2(lines.reduce((sum, l) => sum + lineTotal(l), 0) + surCharge);

/** A line for `item`: `bales` bales priced per bale, or per kg when `kg` is given. */
export const line = (item: Item, bales: number, price: { perBale?: number; kg?: number; perKg?: number }): Line =>
  price.perBale !== undefined
    ? { id: item.id, itemName: item.itemName, noOfBales: bales, ratePerBale: price.perBale }
    : { id: item.id, itemName: item.itemName, noOfBales: bales, baleWeightKgs: price.kg, ratePerKgs: price.perKg };

async function json<T>(res: APIResponse, what: string): Promise<T> {
  expect(res.status(), `${what}: ${await res.text()}`).toBe(200);
  return (await res.json()) as T;
}

/** A request context signed in as `email` (for EDITOR checks). Dispose it in the test. */
export async function loginAs(baseURL: string | undefined, email: string, password: string | undefined) {
  if (!password) throw new Error(`Set the password for ${email} in .env (DEMO_EDITOR_WAREHOUSE_PASSWORD).`);
  const ctx = await playwrightRequest.newContext({ baseURL });
  const res = await ctx.post("/api/user/login", { data: { email, password } });
  expect(res.status(), `login as ${email}: ${await res.text()}`).toBe(200);
  return ctx;
}

export const editor = {
  email: "warehouse@trs.com",
  password: () => process.env.DEMO_EDITOR_WAREHOUSE_PASSWORD,
};

// ---------- companies and items ----------

export async function companyId(api: APIRequestContext, companyName: string): Promise<number> {
  const { rows } = await json<{ rows: { id: number; companyName: string }[] }>(
    await api.get("/api/company", { params: { limit: 1000 } }),
    "list companies"
  );
  const company = rows.find((c) => c.companyName === companyName);
  if (!company) throw new Error(`Seeded company "${companyName}" not found; run pnpm db:seed-demo-org`);
  return company.id;
}

/** Create a company with no items (unique name) and return its id. */
export async function createCompany(api: APIRequestContext, tag: string): Promise<number> {
  const companyName = uid(tag);
  const res = await api.post("/api/company", { data: { companyName } });
  expect(res.status(), `create company: ${await res.text()}`).toBe(200);
  return companyId(api, companyName);
}

/**
 * A new supplier of this test's own. Tests run in parallel against one database, so a test that checks a
 * supplier's ledger total, entry count or purchase count must use its own supplier: another worker's
 * purchases for a shared (seeded) supplier would move those numbers.
 */
export async function newSupplier(api: APIRequestContext, tag: string): Promise<{ id: number; name: string }> {
  const name = uid(tag);
  const res = await api.post("/api/company", { data: { companyName: name } });
  expect(res.status(), `create company: ${await res.text()}`).toBe(200);
  return { id: await companyId(api, name), name };
}

export async function items(api: APIRequestContext, companyId: number, type: BaleType): Promise<Item[]> {
  const { rows } = await json<{ rows: Item[] }>(
    await api.get("/api/items", { params: { companyId, type, limit: 1000 } }),
    "list items"
  );
  // Like purchases, item rows nest `company`; normalise companyId.
  return rows.map((r: any) => ({ ...r, companyId: r.companyId ?? r.company?.id ?? companyId }));
}

export async function seededItem(api: APIRequestContext, companyId: number, type: BaleType, itemName: string) {
  const item = (await items(api, companyId, type)).find((i) => i.itemName === itemName);
  if (!item) throw new Error(`Seeded item "${itemName}" (${type}) not found for company ${companyId}`);
  return item;
}

/** Create a new item (no stock row yet) and return it. SMALL_BALES items need a rate per bale. */
export async function createItem(
  api: APIRequestContext,
  companyId: number,
  type: BaleType,
  opts: { tag?: string; ratePerKgs?: number; ratePerBale?: number } = {}
): Promise<Item> {
  const itemName = uid(opts.tag ?? "item");
  const data: Record<string, unknown> = { companyId, itemName, type };
  if (opts.ratePerKgs !== undefined) data.ratePerKgs = opts.ratePerKgs;
  if (type === "SMALL_BALES" || opts.ratePerBale !== undefined) data.ratePerBale = opts.ratePerBale ?? 10;
  const res = await api.post("/api/items", { data });
  expect(res.status(), `create item: ${await res.text()}`).toBe(200);
  return seededItem(api, companyId, type, itemName);
}

// ---------- purchases ----------

export type NewPurchase = {
  companyId: number;
  baleType: BaleType;
  lines: Line[];
  surCharge?: number | null;
  invoiceNumber?: string | null;
  purchaseDate?: Date;
  /** Defaults to the lines' computed total; only C33 sends an inconsistent one. */
  totalAmount?: number;
};

export const purchaseBody = (p: NewPurchase) => ({
  companyId: p.companyId,
  baleType: p.baleType,
  purchasedProducts: p.lines,
  surCharge: p.surCharge ?? null,
  invoiceNumber: p.invoiceNumber === undefined ? uid("inv") : p.invoiceNumber,
  purchaseDate: (p.purchaseDate ?? new Date()).toISOString(),
  totalAmount: p.totalAmount ?? purchaseTotal(p.lines, p.surCharge ?? 0),
});

// GET /api/purchase/{id} omits companyId and nests `company`; normalise so specs can rely on companyId.
const normalise = (p: any): Purchase => ({
  ...p,
  companyId: p.companyId ?? p.company?.id,
  totalAmount: Number(p.totalAmount),
});

/** All purchases of the organization, or only those of `companyId` (the list's `search` filter). */
export async function listPurchases(api: APIRequestContext, companyId?: number) {
  const params = companyId === undefined ? undefined : { search: companyId };
  const data = await json<{ count: number; rows: Purchase[] }>(
    await api.get("/api/purchase", { params }),
    "list purchases"
  );
  return { count: data.count, rows: data.rows.map(normalise) };
}

/** How many purchases `companyId` has. Scoped to one supplier so parallel tests don't change it. */
export const purchaseCount = async (api: APIRequestContext, companyId: number) =>
  (await listPurchases(api, companyId)).count;

/** Purchases saved with `invoiceNumber`, for any supplier ("nothing saved" checks on refused requests). */
export const withInvoice = async (api: APIRequestContext, invoiceNumber: string) =>
  (await listPurchases(api)).rows.filter((r) => r.invoiceNumber === invoiceNumber);

export async function getPurchase(api: APIRequestContext, id: number) {
  return normalise(await json<Purchase>(await api.get(`/api/purchase/${id}`), `get purchase ${id}`));
}

/** POST a purchase and return it (found by its unique invoice number). */
export async function createPurchase(api: APIRequestContext, p: NewPurchase): Promise<Purchase> {
  const body = purchaseBody({ ...p, invoiceNumber: p.invoiceNumber ?? uid("inv") });
  const res = await api.post("/api/purchase", { data: body });
  expect(res.status(), `create purchase: ${await res.text()}`).toBe(200);
  return findByInvoice(api, body.invoiceNumber as string);
}

export async function findByInvoice(api: APIRequestContext, invoiceNumber: string): Promise<Purchase> {
  const matches = await withInvoice(api, invoiceNumber);
  expect(matches, `purchases with invoice ${invoiceNumber}`).toHaveLength(1);
  return matches[0];
}

export const editPurchase = (api: APIRequestContext, id: number, body: Record<string, unknown>) =>
  api.put(`/api/purchase/${id}`, { data: body });

export const approve = (api: APIRequestContext, id: number) => api.put(`/api/purchase/approve/${id}`);
export const cancel = (api: APIRequestContext, id: number) => api.put(`/api/purchase/cancel/${id}`);

/** Approve from the purchase list (check icon, then Yes) and wait for the row to show APPROVED. */
export async function approveFromList(page: Page, invoiceNumber: string) {
  const row = page.getByRole("row").filter({ hasText: invoiceNumber });
  await page.goto("/purchase");
  await row.getByRole("img", { name: "check" }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  await expect(row).toContainText("APPROVED");
}

export async function approveOk(api: APIRequestContext, id: number) {
  const res = await approve(api, id);
  expect(res.status(), `approve purchase ${id}: ${await res.text()}`).toBe(200);
}

/** A new BIG_BALES item already in stock: an approved opening purchase of `bales` × 10 kg × Rs 10/kg. */
export async function stockedItem(api: APIRequestContext, companyId: number, tag: string, bales = 4) {
  const item = await createItem(api, companyId, "BIG_BALES", { tag, ratePerKgs: 10 });
  const opening = await createPurchase(api, {
    companyId,
    baleType: "BIG_BALES",
    lines: [line(item, bales, { kg: 10, perKg: 10 })],
  });
  await approveOk(api, opening.id);
  return item;
}

/** Revise via the API: PUT the new lines (and total) on a purchase, keeping company and bale type. */
export async function revise(api: APIRequestContext, p: Purchase, lines: Line[], surCharge = p.surCharge ?? 0) {
  const res = await editPurchase(api, p.id, {
    companyId: p.companyId,
    baleType: p.baleType,
    purchaseDate: p.purchaseDate,
    invoiceNumber: p.invoiceNumber,
    surCharge,
    purchasedProducts: lines,
    totalAmount: purchaseTotal(lines, surCharge),
  });
  expect(res.status(), `revise purchase ${p.id}: ${await res.text()}`).toBe(200);
}

// ---------- stock and ledger ----------

/** On-hand bales for an item, or null when it has no stock row. */
export async function stockOf(api: APIRequestContext, itemId: number): Promise<number | null> {
  const res = await api.get(`/api/inventory/${itemId}`);
  if (res.status() === 404) return null;
  const row = await json<{ onHand: number }>(res, `stock of item ${itemId}`);
  return Number(row.onHand);
}

export async function ledger(api: APIRequestContext, companyId: number) {
  const data = await json<{ transactions: LedgerRow[]; totalBalance: number }>(
    await api.get(`/api/ledger/${companyId}`, { params: { type: "company" } }),
    `ledger of company ${companyId}`
  );
  const rows = data.transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    transactionId: t.transactionId == null ? null : Number(t.transactionId),
    partyBalance: Number(t.partyBalance ?? t.totalBalance),
  }));
  return { rows, entries: rows.length, balance: Number(data.totalBalance) };
}

/** The supplier ledger entries posted by purchase `purchaseId`. */
export const entriesFor = (rows: LedgerRow[], purchaseId: number) =>
  rows.filter((r) => r.transactionId === purchaseId && !r.paymentType);

// ---------- downstream: sales and supplier payments ----------

export async function anyCustomerId(api: APIRequestContext): Promise<number> {
  const { rows } = await json<{ rows: { id: number }[] }>(
    await api.get("/api/customer", { params: { limit: 1 } }),
    "list customers"
  );
  if (!rows.length) throw new Error("No seeded customer; run pnpm db:seed-demo-org");
  return rows[0].id;
}

/** Create and approve a sale of `bales` bales of `item` (priced per bale) and return the sale. */
export async function approvedSale(
  api: APIRequestContext,
  customerId: number,
  item: Item,
  bales: number,
  perBale = 50
) {
  const soldProducts = [
    { id: item.id, itemName: item.itemName, companyId: item.companyId, noOfBales: bales, ratePerBale: perBale },
  ];
  const create = await api.post("/api/sales", {
    data: { customerId, totalAmount: bales * perBale, soldDate: new Date().toISOString(), soldProducts },
  });
  expect(create.status(), `create sale: ${await create.text()}`).toBe(200);
  const { rows } = await json<{ rows: any[] }>(await api.get("/api/sales"), "list sales");
  const sale = rows.find((s) => s.soldProducts?.some((p: any) => Number(p.id) === item.id));
  if (!sale) throw new Error(`sale of ${item.itemName} not found`);
  const ok = await api.put(`/api/sales/approve/${sale.id}`);
  expect(ok.status(), `approve sale: ${await ok.text()}`).toBe(200);
  return json<any>(await api.get(`/api/sales/${sale.id}`), "get sale");
}

export async function customerLedger(api: APIRequestContext, customerId: number) {
  return json<{ transactions: LedgerRow[]; totalBalance: number }>(
    await api.get(`/api/ledger/${customerId}`, { params: { type: "customer" } }),
    `ledger of customer ${customerId}`
  );
}

/** Record a cash payment to the supplier (legacy company-only shape): supplier balance − amount. */
export async function payCompany(api: APIRequestContext, companyId: number, amount: number, paymentDate = new Date()) {
  const res = await api.post("/api/ledger/createPayment", {
    data: {
      companyId,
      totalAmount: amount,
      spendType: "DEBIT",
      paymentType: "CASH",
      paymentDate: paymentDate.toISOString(),
    },
  });
  expect(res.status(), `pay company: ${await res.text()}`).toBe(200);
}

/**
 * Inputs of an item row on the purchase form in Edit All mode, in column order (components/addItemsInPo.js):
 * No of Bales, Bale Weight (LBS), Bale Weight (KGS), Rate per (LBS), Rate Per (KGS), then Rate Per Bale (SMALL_BALES only).
 */
export const FORM_INPUT = { bales: 0, lbs: 1, kgs: 2, ratePerLbs: 3, ratePerKgs: 4, ratePerBale: 5 } as const;
