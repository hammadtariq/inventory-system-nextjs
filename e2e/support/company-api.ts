import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import * as po from "./purchase-api";
import { asTenant } from "./second-org";

/**
 * Helpers for supplier (company) tests (specs/companies-crud.md). Tests create their own suppliers with
 * unique names and never rename or delete seeded ones. `api` is the `request` fixture (demo ADMIN) or a
 * context from `po.loginAs`.
 */

export type Company = {
  id: number;
  companyName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  organizationId: number;
};

export const DUPLICATE = (name: string) => `Company "${name}" already exists in this organization.`;

/**
 * A mixed-case supplier name unique to this run and worker, e.g. "QA Coastal lq2x9a3f", like seeded and
 * API-created suppliers. The form saves names lowercase (owner Q5), so compare with `.toLowerCase()`.
 */
export const supplierName = (label: string) =>
  `QA ${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** POST a supplier and return it. `fields` may add email, phone and address. */
export async function createSupplier(
  api: APIRequestContext,
  label: string,
  fields: Partial<Pick<Company, "email" | "phone" | "address">> & { companyName?: string } = {}
): Promise<Company> {
  const companyName = fields.companyName ?? supplierName(label);
  const res = await api.post("/api/company", { data: { ...fields, companyName } });
  expect(res.status(), `create company ${companyName}: ${await res.text()}`).toBe(200);
  const [company] = await companiesNamed(api, companyName, { exactCase: true });
  expect(company, `company ${companyName} after create`).toBeTruthy();
  return company;
}

/**
 * This organization's companies whose name equals `name`, ignoring case unless `exactCase` (Q3: names
 * are unique regardless of case, so case-insensitive is the business view). Reads the full list.
 */
export async function companiesNamed(api: APIRequestContext, name: string, { exactCase = false } = {}) {
  const res = await api.get("/api/company", { params: { limit: 5000 } });
  expect(res.status(), `list companies: ${await res.text()}`).toBe(200);
  const { rows } = (await res.json()) as { rows: Company[] };
  const same = (a: string) => (exactCase ? a === name : a.toLowerCase() === name.trim().toLowerCase());
  return rows.filter((c) => same(c.companyName));
}

export async function getCompany(api: APIRequestContext, id: number): Promise<Company> {
  const res = await api.get(`/api/company/${id}`);
  expect(res.status(), `get company ${id}: ${await res.text()}`).toBe(200);
  return (await res.json()) as Company;
}

/** GET /api/company/search for `value`; the ids it returns. */
export async function searchIds(api: APIRequestContext, value: string): Promise<number[]> {
  const res = await api.get("/api/company/search", { params: { value } });
  expect(res.status(), `search companies "${value}": ${await res.text()}`).toBe(200);
  return ((await res.json()) as Company[]).map((c) => c.id);
}

export type Role = "ADMIN" | "EDITOR";

/**
 * A browser page signed in as `role`: ADMIN reuses the saved storage state, EDITOR logs in through the
 * login form (DEMO_EDITOR_WAREHOUSE_PASSWORD). Close the page's context in the test.
 */
export async function pageAs(browser: Browser, role: Role, baseURL: string | undefined): Promise<Page> {
  if (role === "ADMIN") {
    const context = await browser.newContext({ baseURL, storageState: "playwright/.auth/admin.json" });
    return context.newPage();
  }
  const password = po.editor.password();
  if (!password)
    throw new Error("Set DEMO_EDITOR_WAREHOUSE_PASSWORD in .env to log in as the EDITOR (warehouse@trs.com).");
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(po.editor.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  return page;
}

/**
 * Open /company and return the row of supplier `name`, paging through the list like staff do (50 rows a
 * page, newest first; parallel tests add suppliers, so a row can move past page 1). The forms are reached
 * through the list's buttons: loading them directly disables Save (#244, CO-07).
 */
export async function companyRow(page: Page, name: string) {
  await page.goto("/company");
  const firstRow = page.getByRole("row").nth(1);
  await expect(firstRow).toBeVisible({ timeout: 15_000 });
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const row = page.getByRole("row").filter({ hasText: new RegExp(escaped, "i") });
  for (let pageNo = 1; pageNo < 10 && !(await row.count()); pageNo++) {
    const top = await firstRow.innerText();
    await page.getByRole("listitem", { name: "Next Page" }).click();
    await expect(firstRow).not.toHaveText(top);
  }
  return row;
}

/** Open the create form the way staff do: /company, then the list's Create button. */
export async function openCreateForm(page: Page) {
  await page.goto("/company");
  // Wait for the list to render: a click before hydration does nothing.
  await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/company\/create$/, { timeout: 15_000 });
}

/** Purchase-history (revision) rows of `purchaseId`, read inside the organization's tenant scope. */
export async function historyCount(organizationId: number, purchaseId: number): Promise<number> {
  return asTenant(organizationId, async (db) => {
    const res = await db.query(`SELECT count(*)::int AS n FROM purchase_histories WHERE "purchaseId" = $1`, [
      purchaseId,
    ]);
    return res.rows[0].n as number;
  });
}

/**
 * Open `path` and wait until its company picker has loaded its options (`/api/company?attributes=…`),
 * so that "not offered" (`toHaveCount(0)`) is checked against the real list, not an empty one.
 */
export async function openWithCompanyPicker(page: Page, path: string) {
  const loaded = page.waitForResponse((r) => r.url().includes("/api/company?attributes") && r.ok());
  await page.goto(path);
  await loaded;
}
