// spec: specs/purchase-orders.md (4.1 C16, 4.2 C20)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

const NOT_PERMITTED = "Operation not permitted.";

// Both tests act as the EDITOR in the browser, so drop the default ADMIN storage state.
test.use({ storageState: { cookies: [], origins: [] } });

async function loginAsEditorInBrowser(page: import("@playwright/test").Page) {
  const password = po.editor.password();
  if (!password)
    throw new Error("Set DEMO_EDITOR_WAREHOUSE_PASSWORD in .env to log in as the EDITOR (warehouse@trs.com).");
  await page.goto("/login");
  await page.getByLabel("Email").fill(po.editor.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Permissions and isolation", () => {
  test(
    "Staff (EDITOR) prepare and correct purchases, but only the owner can approve or cancel them",
    { annotation: tr("C16"), tag: "@smoke" },
    async ({ page, playwright }) => {
      const baseURL = test.info().project.use.baseURL;
      const admin = await playwright.request.newContext({ storageState: "playwright/.auth/admin.json", baseURL });
      const ed = await po.loginAs(baseURL, po.editor.email, po.editor.password());
      try {
        // An own supplier and item: parallel tests post to the seeded ones and would move the ledger.
        const supplier = await po.newSupplier(admin, "c16-supplier");
        const companyId = supplier.id;
        const item = await po.createItem(admin, companyId, "SMALL_BALES", { tag: "c16" });
        const stockBefore = await po.stockOf(admin, item.id);
        const ledgerBefore = await po.ledger(admin, companyId);
        const invoice = po.uid("c16-inv");
        let purchaseId = 0;

        await loginAsEditorInBrowser(page);
        const row = page.getByRole("row").filter({ hasText: invoice });

        // 1. As EDITOR create a purchase for the supplier, SMALL_BALES, 3 bales × Rs 20/bale in the UI
        await test.step("EDITOR creates a 3 x Rs 20 purchase in the UI: PENDING, total 60, stock and ledger unchanged", async () => {
          await page.goto("/purchase/create");
          await antSelect(page, "Company", supplier.name);
          await antSelect(page, "List Type", "SMALL_BALES");
          await page.getByLabel("Invoice No").fill(invoice);
          await page.getByRole("button", { name: "Edit All" }).click();
          const itemRow = page.getByRole("row").filter({ hasText: item.itemName });
          await itemRow.getByRole("spinbutton").first().fill("3");
          await itemRow.getByRole("spinbutton").last().fill("20");
          await page.getByRole("button", { name: "Save All" }).click();
          await page.getByRole("button", { name: "Create Purchase" }).click();
          await expect(page).toHaveURL(/\/purchase$/);

          const created = await po.findByInvoice(admin, invoice);
          purchaseId = created.id;
          expect(created.status).toBe("PENDING");
          expect(created.totalAmount).toBe(60);
          expect(await po.stockOf(admin, item.id)).toBe(stockBefore);
          const ledgerAfter = await po.ledger(admin, companyId);
          expect(ledgerAfter.entries).toBe(ledgerBefore.entries);
          expect(ledgerAfter.balance).toBe(ledgerBefore.balance);
        });

        // 2. Open /purchase
        await test.step("The row shows only the pencil icon, no approve or cancel", async () => {
          await page.goto("/purchase");
          await expect(row).toBeVisible();
          await expect(row).toContainText("PENDING");
          await expect(row.getByRole("img", { name: "edit" })).toBeVisible();
          await expect(row.getByRole("img", { name: "check" })).toHaveCount(0);
          await expect(row.getByRole("img", { name: "close" })).toHaveCount(0);
        });

        // 3. Edit it: Sur Charge 25, 4 bales; Update Purchase
        await test.step("EDITOR edits to Sur Charge 25 and 4 bales: total 105, still PENDING", async () => {
          await row.getByRole("img", { name: "edit" }).click();
          await expect(page).toHaveURL(new RegExp(`/purchase/${purchaseId}$`));
          await page.getByRole("button", { name: "Edit All" }).click();
          const itemRow = page.getByRole("row").filter({ hasText: item.itemName });
          await itemRow.getByRole("spinbutton").first().fill("4");
          await page.getByRole("button", { name: "Save All" }).click();
          await page.getByLabel("Sur Charge (RS)").fill("25");
          await page.getByRole("button", { name: "Update Purchase" }).click();
          await expect(page).toHaveURL(/\/purchase$/);

          const updated = await po.getPurchase(admin, purchaseId);
          expect(updated.status).toBe("PENDING");
          expect(Number(updated.surCharge)).toBe(25);
          expect(updated.purchasedProducts[0].noOfBales).toBe(4);
          expect(updated.totalAmount).toBe(105);
          await page.reload();
          await expect(row).toContainText("PENDING");
          await expect(row).toContainText("105");
        });

        // 4. As EDITOR PUT approve, then cancel, on it
        await test.step("EDITOR approve and cancel are refused with 403; as ADMIN it is still PENDING, stock and ledger unchanged", async () => {
          const approveRes = await po.approve(ed, purchaseId);
          expect(approveRes.status()).toBe(403);
          expect(await approveRes.text()).toContain(NOT_PERMITTED);
          const cancelRes = await po.cancel(ed, purchaseId);
          expect(cancelRes.status()).toBe(403);
          expect(await cancelRes.text()).toContain(NOT_PERMITTED);

          const after = await po.getPurchase(admin, purchaseId);
          expect(after.status).toBe("PENDING");
          expect(after.totalAmount).toBe(105);
          expect(await po.stockOf(admin, item.id)).toBe(stockBefore);
          const ledgerAfter = await po.ledger(admin, companyId);
          expect(ledgerAfter.entries).toBe(ledgerBefore.entries);
          expect(ledgerAfter.balance).toBe(ledgerBefore.balance);
        });
      } finally {
        await ed.dispose();
        await admin.dispose();
      }
    }
  );

  test(
    "Staff can view an approved purchase but can't change it",
    { annotation: tr("C20"), tag: "@smoke" },
    async ({ page, playwright }) => {
      test.fixme(!po.runKnownBugs, "Known bug #216: an EDITOR can edit an APPROVED purchase, reopening it as PENDING.");
      const baseURL = test.info().project.use.baseURL;
      const admin = await playwright.request.newContext({ storageState: "playwright/.auth/admin.json", baseURL });
      const ed = await po.loginAs(baseURL, po.editor.email, po.editor.password());
      try {
        // Preconditions: an APPROVED 3 x Rs 20 purchase created and approved by ADMIN through the API.
        // An own supplier and item: parallel tests post to the seeded ones and would move the ledger.
        const companyId = (await po.newSupplier(admin, "c20-supplier")).id;
        const item = await po.createItem(admin, companyId, "SMALL_BALES", { tag: "c20" });
        const lines = [po.line(item, 3, { perBale: 20 })];
        const created = await po.createPurchase(admin, {
          companyId,
          baleType: "SMALL_BALES",
          lines,
          invoiceNumber: po.uid("c20-inv"),
        });
        await po.approveOk(admin, created.id);
        const recorded = await po.getPurchase(admin, created.id);
        expect.soft(recorded.status).toBe("APPROVED");
        expect.soft(recorded.totalAmount).toBe(60);
        const stockBefore = await po.stockOf(admin, item.id);
        const ledgerBefore = await po.ledger(admin, companyId);

        await loginAsEditorInBrowser(page);

        // 1. As EDITOR open /purchase
        await test.step("P's row shows APPROVED with no edit, approve or cancel action; P can be opened to view it", async () => {
          await page.goto("/purchase");
          const row = page.getByRole("row").filter({ hasText: recorded.invoiceNumber as string });
          await expect.soft(row).toBeVisible();
          await expect.soft(row).toContainText("APPROVED");
          await expect.soft(row.getByRole("img", { name: "edit" })).toHaveCount(0);
          await expect.soft(row.getByRole("img", { name: "check" })).toHaveCount(0);
          await expect.soft(row.getByRole("img", { name: "close" })).toHaveCount(0);
          await expect
            .soft(row.getByRole("link", { name: String(recorded.id) }))
            .toHaveAttribute("href", new RegExp(`/purchase/${recorded.id}\\?type=view`));
        });

        // 2. As EDITOR open /purchase/{P}
        await test.step("P's values are shown and can't be changed or saved", async () => {
          await page.goto(`/purchase/${recorded.id}`);
          await expect.soft(page.getByLabel("Invoice No")).toHaveValue(recorded.invoiceNumber as string);
          await expect.soft(page.getByLabel("Sur Charge (RS)")).toBeDisabled();
          await expect.soft(page.getByRole("button", { name: "Edit All" })).toHaveCount(0);
          await expect.soft(page.getByRole("button", { name: "Update Purchase" })).toHaveCount(0);
        });

        // 3. As EDITOR PUT /api/purchase/{P} with 5 bales and total 100
        await test.step("EDITOR PUT with 5 bales and total 100 is refused with 403", async () => {
          const res = await po.editPurchase(ed, recorded.id, {
            companyId,
            baleType: "SMALL_BALES",
            purchaseDate: recorded.purchaseDate,
            invoiceNumber: recorded.invoiceNumber,
            surCharge: 0,
            purchasedProducts: [po.line(item, 5, { perBale: 20 })],
            totalAmount: 100,
          });
          expect.soft(res.status()).toBe(403);
          expect.soft(await res.text()).toContain(NOT_PERMITTED);
        });

        // 4. As ADMIN GET P, inventory and the supplier ledger
        await test.step("As ADMIN P is unchanged: APPROVED, revision and lines as recorded, total 60, stock and ledger unchanged", async () => {
          const after = await po.getPurchase(admin, recorded.id);
          expect.soft(after.status).toBe("APPROVED");
          expect.soft(after.revisionNo).toBe(recorded.revisionNo);
          expect.soft(after.purchasedProducts).toEqual(recorded.purchasedProducts);
          expect.soft(after.totalAmount).toBe(60);
          expect.soft(await po.stockOf(admin, item.id)).toBe(stockBefore);
          const ledgerAfter = await po.ledger(admin, companyId);
          expect.soft(ledgerAfter.entries).toBe(ledgerBefore.entries);
          expect.soft(ledgerAfter.balance).toBe(ledgerBefore.balance);
        });
      } finally {
        await ed.dispose();
        await admin.dispose();
      }
    }
  );
});
