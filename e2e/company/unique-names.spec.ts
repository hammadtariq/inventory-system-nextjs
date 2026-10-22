// spec: specs/companies-crud.md (CO-03 C509, CO-04 C510)
// seed: e2e/seed.spec.ts

import { randomUUID } from "node:crypto";
import { test, expect, tr } from "../fixtures";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";
import { asTenant, createOtherOrg } from "../support/second-org";

// The response's error message; a successful create or rename has an empty body.
const message = async (res: { text(): Promise<string> }) => {
  const body = await res.text();
  return body ? (JSON.parse(body) as { message?: string }).message ?? "" : "";
};

test.describe("Unique supplier names", () => {
  test(
    "A second supplier with the same name is refused on create and rename, even with surrounding spaces or a double-click; another organization may use the name",
    { annotation: tr("C509"), tag: "@smoke" },
    async ({ page, request }) => {
      const a = await co.createSupplier(request, "Coastal Traders");
      const b = await co.createSupplier(request, "Harbor Mills");

      // 1. POST /api/company with the row's name
      for (const [row, sent] of [
        ["exact", a.companyName],
        ["surrounding spaces", `  ${a.companyName}  `],
      ]) {
        await test.step(`Create with the ${row} name is refused with 409`, async () => {
          const res = await request.post("/api/company", { data: { companyName: sent } });
          expect.soft(res.status()).toBe(409);
          expect.soft(await message(res)).toBe(co.DUPLICATE(a.companyName));
        });
      }

      // 2. PUT /api/company/{B} with companyName = A's name
      await test.step("Renaming B to A's name is refused with 409 and B keeps its name", async () => {
        const res = await request.put(`/api/company/${b.id}`, { data: { companyName: a.companyName } });
        expect.soft(res.status()).toBe(409);
        expect.soft(await message(res)).toBe(co.DUPLICATE(a.companyName));
        expect((await co.getCompany(request, b.id)).companyName).toBe(b.companyName);
      });

      // 3. Three creates of one name at once, and a double-click on the form's Create
      await test.step("Concurrent creates and a double-clicked Create each leave exactly one supplier", async () => {
        const race = co.supplierName("Race Supplies");
        const statuses = await Promise.all(
          [1, 2, 3].map(async () => (await request.post("/api/company", { data: { companyName: race } })).status())
        );
        expect.soft(statuses.sort()).toEqual([200, 409, 409]);
        expect.soft(await co.companiesNamed(request, race)).toHaveLength(1);

        const clicked = co.supplierName("Double Click");
        await co.openCreateForm(page);
        await page.getByLabel("Name").fill(clicked);
        await page.getByRole("button", { name: "Create", exact: true }).dblclick();
        await expect(page).toHaveURL(/\/company$/);
        await expect.poll(async () => (await co.companiesNamed(request, clicked)).length).toBe(1);
      });

      // 4. Insert a company with A's exact name into the second organization
      await test.step("Another organization can use A's exact name", async () => {
        const other = await createOtherOrg("c509");
        const inserted = await asTenant(other.organizationId, async (db) => {
          const res = await db.query(
            `INSERT INTO companies ("companyName", uuid, "organizationId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
            [a.companyName, randomUUID(), other.organizationId]
          );
          return res.rows[0].id as number;
        });
        expect(inserted).toBeGreaterThan(0);
      });

      // 5. GET /api/company/search?value=<A's name>
      await test.step("This organization still has exactly one A", async () => {
        const ids = await co.searchIds(request, a.companyName);
        expect(ids).toEqual([a.id]);
        expect(await co.companiesNamed(request, a.companyName, { exactCase: true })).toHaveLength(1);
      });
    }
  );

  test(
    "A supplier name that differs only in letter case from an existing one is refused, from the form and the API",
    { annotation: tr("C510"), tag: "@smoke" },
    async ({ page, request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #248 (owner Q3): company names are unique only with the exact same case; the form saves lowercase."
      );
      const a = await co.createSupplier(request, "Coastal Case");
      const b = await co.createSupplier(request, "Harbor Case");

      // 1. In the form, create A's name (the form lowercases it)
      await test.step("The form refuses A's name in lower case and adds no row", async () => {
        await co.openCreateForm(page);
        await page.getByLabel("Name").fill(a.companyName);
        await page.getByRole("button", { name: "Create", exact: true }).click();
        await expect.soft(page.getByText("already exists in this organization.")).toBeVisible();
        await expect.soft(page).toHaveURL(/\/company\/create$/);
        expect.soft(await co.companiesNamed(request, a.companyName)).toHaveLength(1);
      });

      // 2. POST /api/company in upper case
      await test.step("The API refuses A's name in upper case with 409", async () => {
        const res = await request.post("/api/company", { data: { companyName: a.companyName.toUpperCase() } });
        expect.soft(res.status()).toBe(409);
        expect.soft(await message(res)).toContain("already exists in this organization.");
      });

      // 3. PUT /api/company/{B} with A's name in lower case
      await test.step("Renaming B to A's name in lower case is refused with 409 and B keeps its name", async () => {
        const res = await request.put(`/api/company/${b.id}`, { data: { companyName: a.companyName.toLowerCase() } });
        expect.soft(res.status()).toBe(409);
        expect.soft((await co.getCompany(request, b.id)).companyName).toBe(b.companyName);
      });

      // 4. Look the name up in every case
      await test.step("Exactly one supplier has A's name in any case", async () => {
        expect(await co.companiesNamed(request, a.companyName)).toHaveLength(1);
      });
    }
  );
});
