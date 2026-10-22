// spec: specs/companies-crud.md (CO-05 C511, CO-06 C512)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antCombobox, antOptionsMatching } from "../support/antd";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";

test.describe("Edit a supplier", () => {
  test(
    "Renaming a supplier and changing its contact details keeps its purchases, items, stock and ledger attached, now under the new name",
    { annotation: tr("C511"), tag: "@smoke" },
    async ({ browser, request }) => {
      test.slow(); // a six-checkpoint journey across the list, purchases, ledger, export and picker
      // Preconditions (ADMIN, API): supplier S with an APPROVED 5 x Rs 100 purchase and a Rs 200 payment.
      const s = await co.createSupplier(request, "Rename Old", {
        email: "old@vendor.com",
        phone: "0300 5555555",
        address: "9 Old Market Road, Lahore",
      });
      const item = await po.createItem(request, s.id, "SMALL_BALES", { tag: "c511", ratePerBale: 100 });
      const purchase = await po.createPurchase(request, {
        companyId: s.id,
        baleType: "SMALL_BALES",
        lines: [po.line(item, 5, { perBale: 100 })],
      });
      await po.approveOk(request, purchase.id);
      await po.payCompany(request, s.id, 200);
      const before = await po.ledger(request, s.id);
      expect.soft(before.entries).toBe(2);
      expect.soft(before.balance).toBe(300);
      expect.soft(await po.stockOf(request, item.id)).toBe(5);

      const newName = co.supplierName("Rename New");
      const stored = newName.toLowerCase();
      const page = await co.pageAs(browser, "EDITOR", test.info().project.use.baseURL);
      try {
        // 1. As EDITOR, edit S from the list: new name, email and address
        await test.step("EDITOR renames S and changes its email and address from the list", async () => {
          const row = await co.companyRow(page, s.companyName);
          await row.getByRole("button", { name: "Edit" }).click();
          await expect(page.getByLabel("Name")).toHaveValue(s.companyName);
          await page.getByLabel("Name").fill(newName);
          await page.getByLabel("Email").fill("new@vendor.com");
          await page.getByLabel("Address").fill("45 Mill Road, Faisalabad");
          await page.getByRole("button", { name: "Update" }).click();
          await expect(page).toHaveURL(/\/company$/);
          await page.reload();
          await expect(page.getByRole("row").filter({ hasText: stored })).toContainText("new@vendor.com");
        });

        // 2. GET /api/company/{S}
        await test.step("Same id with the new name, email and address; phone unchanged", async () => {
          const after = await co.getCompany(request, s.id);
          expect(after).toMatchObject({
            id: s.id,
            companyName: stored,
            email: "new@vendor.com",
            phone: "0300 5555555",
          });
          // The address's case is CO-15 (known bug, owner Q9).
          expect(after.address?.toLowerCase()).toBe("45 mill road, faisalabad");
        });

        // 3. The purchase, the item and its stock
        await test.step("The purchase (500, APPROVED) and the item show the new name; on-hand still 5", async () => {
          const { rows } = await po.listPurchases(request, s.id);
          expect(rows).toHaveLength(1);
          expect(rows[0]).toMatchObject({ id: purchase.id, status: "APPROVED", totalAmount: 500 });
          expect((rows[0] as any).company?.companyName).toBe(stored);
          const [listed] = (await po.items(request, s.id, "SMALL_BALES")).filter((i) => i.id === item.id);
          expect((listed as any).company?.companyName).toBe(stored);
          expect(await po.stockOf(request, item.id)).toBe(5);

          await page.goto("/purchase");
          await expect(page.getByRole("row").filter({ hasText: purchase.invoiceNumber as string })).toContainText(
            stored
          );
        });

        // 4. The supplier ledger
        await test.step("The ledger still has 2 entries and balance 300, under the new name", async () => {
          const after = await po.ledger(request, s.id);
          expect(after.entries).toBe(2);
          expect(after.balance).toBe(300);
          await page.goto(`/ledger/${s.id}?type=company`);
          await expect(page.getByText(stored).first()).toBeVisible();
        });

        // 5. Export the statement as CSV
        await test.step("The exported statement names the new supplier, lists 500 and 200 and ends at 300", async () => {
          const res = await request.get("/api/ledger/exportCustomer", {
            params: { id: s.id, type: "company", fileType: "csv" },
          });
          expect(res.status(), await res.text()).toBe(200);
          const csv = await res.text();
          expect(csv).toContain(stored);
          expect(csv).not.toContain(s.companyName);
          expect(csv).toMatch(/\b500\b/);
          expect(csv).toMatch(/\b200\b/);
          expect(csv).toMatch(/\b300\b/);
        });

        // 6. The purchase form's company picker
        await test.step("The purchase picker offers the new name, not the old one", async () => {
          await page.goto("/purchase/create");
          await expect(await antOptionsMatching(page, antCombobox(page, "Company"), stored)).toHaveCount(1);
          await co.openWithCompanyPicker(page, "/purchase/create");
          const old = await antOptionsMatching(page, antCombobox(page, "Company"), s.companyName);
          await expect(old).toHaveCount(0);
        });
      } finally {
        await page.context().close();
      }
    }
  );

  test(
    "Staff can save a supplier whose email, phone or address is empty, and can clear one of those fields",
    { annotation: tr("C512") },
    async ({ page, request }) => {
      test.fixme(
        !po.runKnownBugs,
        'Known bug #249 (owner Q4): the edit form sends null/"" for empty fields and the API rejects them, e.g. "phone" must be a string.'
      );
      const e = await co.createSupplier(request, "Empty Fields");
      const f = await co.createSupplier(request, "Full Fields", {
        email: "full@vendor.com",
        phone: "0300 7777777",
        address: "7 Full Street, Multan",
      });
      const renamed = co.supplierName("Empty Renamed");

      // 1. Edit E (no email, phone or address): change only the name
      await test.step("E saves with only the name changed, without an error", async () => {
        const row = await co.companyRow(page, e.companyName);
        await row.getByRole("button", { name: "Edit" }).click();
        await expect(page.getByLabel("Name")).toHaveValue(e.companyName);
        await page.getByLabel("Name").fill(renamed);
        await page.getByRole("button", { name: "Update" }).click();
        await expect(page).toHaveURL(/\/company$/);
      });

      // 2. Edit F: clear email, phone and address
      await test.step("F saves with email, phone and address cleared and shows N/A", async () => {
        const row = await co.companyRow(page, f.companyName);
        await row.getByRole("button", { name: "Edit" }).click();
        await expect(page.getByLabel("Name")).toHaveValue(f.companyName);
        await page.getByLabel("Email").clear();
        await page.getByLabel("Phone").clear();
        await page.getByLabel("Address").clear();
        await page.getByRole("button", { name: "Update" }).click();
        await expect(page).toHaveURL(/\/company$/);
        const listed = await co.companyRow(page, f.companyName);
        await expect(listed.getByRole("cell", { name: "N/A", exact: true })).toHaveCount(3);
      });

      // 3. GET both
      await test.step("E has the new name; F's email, phone and address are empty", async () => {
        expect((await co.getCompany(request, e.id)).companyName).toBe(renamed.toLowerCase());
        const after = await co.getCompany(request, f.id);
        for (const field of ["email", "phone", "address"] as const) expect(after[field] ?? "").toBe("");
      });

      // 4. PUT null and "" directly
      await test.step("PUT { email: null } and { phone: '' } succeed and the fields stay empty", async () => {
        expect((await request.put(`/api/company/${f.id}`, { data: { email: null } })).status()).toBe(200);
        expect((await request.put(`/api/company/${f.id}`, { data: { phone: "" } })).status()).toBe(200);
        const after = await co.getCompany(request, f.id);
        expect(after.email ?? "").toBe("");
        expect(after.phone ?? "").toBe("");
      });
    }
  );
});
