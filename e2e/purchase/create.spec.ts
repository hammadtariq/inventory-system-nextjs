// spec: specs/purchase-orders.md (1.1 C4)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

const SUPPLIER = "Ironwood Imports";

test.describe("Create and price a purchase", () => {
  test(
    "Staff record a purchase in the form and it is saved as PENDING with the right total, without touching stock or ledger",
    { annotation: tr("C4"), tag: "@smoke" },
    async ({ page, request }) => {
      // Setup: two SMALL_BALES items A and B for the supplier, created through the API.
      const companyId = await po.companyId(request, SUPPLIER);
      const itemA = await po.createItem(request, companyId, "SMALL_BALES", { tag: "c4-a" });
      const itemB = await po.createItem(request, companyId, "SMALL_BALES", { tag: "c4-b" });
      const stockABefore = await po.stockOf(request, itemA.id);
      const stockBBefore = await po.stockOf(request, itemB.id);
      const ledgerBefore = await po.ledger(request, companyId);
      const invoice = po.uid("c4-inv");

      const rowOf = (name: string) => page.getByRole("row").filter({ hasText: name });
      const totalAmount = page.getByLabel("Total Amount (RS)");
      const totalBundles = page.getByLabel("Total Bundle(s)");
      const createButton = page.getByRole("button", { name: "Create Purchase" });

      const expectStockAndLedgerUnchanged = async () => {
        expect(await po.stockOf(request, itemA.id)).toBe(stockABefore);
        expect(await po.stockOf(request, itemB.id)).toBe(stockBBefore);
        const ledgerAfter = await po.ledger(request, companyId);
        expect(ledgerAfter.entries).toBe(ledgerBefore.entries);
        expect(ledgerAfter.balance).toBe(ledgerBefore.balance);
      };

      // 1. Setup done above; open /purchase/create as ADMIN
      await test.step("The empty form shows totals of 0 and 'Create Purchase' is disabled", async () => {
        await page.goto("/purchase/create");
        await expect(page.getByRole("heading", { name: "Create Purchase Order" })).toBeVisible();
        await expect(totalAmount).toHaveValue("0");
        await expect(totalBundles).toHaveValue("0");
        await expect(createButton).toBeDisabled();
      });

      // 2. Select company 'Ironwood Imports' and List Type SMALL_BALES
      await test.step("The Rate Per Bale column shows and both new items are listed", async () => {
        await antSelect(page, "Company", SUPPLIER);
        await antSelect(page, "List Type", "SMALL_BALES");
        await expect(page.getByRole("columnheader", { name: "Rate Per Bale" })).toBeVisible();
        await expect(rowOf(itemA.itemName)).toBeVisible();
        await expect(rowOf(itemB.itemName)).toBeVisible();
      });

      // 3. Keep only A and B; Edit All; A: 3 bales x Rs 10/bale, B: 2 bales x Rs 20/bale; Save All
      await test.step("Total Bundle(s) is 5 and Total Amount is 70", async () => {
        await page.getByRole("button", { name: "Edit All" }).click();
        const rowA = rowOf(itemA.itemName);
        const rowB = rowOf(itemB.itemName);
        await rowA.getByRole("spinbutton").first().fill("3");
        await rowA.getByRole("spinbutton").last().fill("10");
        await rowB.getByRole("spinbutton").first().fill("2");
        await rowB.getByRole("spinbutton").last().fill("20");
        // Save All keeps the rows that were filled in and drops the rest, so only A and B remain.
        await page.getByRole("button", { name: "Save All" }).click();
        await expect(rowOf(itemA.itemName)).toBeVisible();
        await expect(rowOf(itemB.itemName)).toBeVisible();
        await expect(rowOf("mixed winter jackets")).toHaveCount(0);
        await expect(totalBundles).toHaveValue("5");
        await expect(totalAmount).toHaveValue("70");
      });

      // 4. Enter a unique Invoice No and Sur Charge 50
      await test.step("Total Amount becomes 120", async () => {
        await page.getByLabel("Invoice No").fill(invoice);
        await page.getByLabel("Sur Charge (RS)").fill("50");
        await expect(totalAmount).toHaveValue("120");
      });

      // 5. Click 'Create Purchase'
      await test.step("Redirected to /purchase with a PENDING row showing the supplier, bale type, invoice, surcharge 50 and total 120", async () => {
        await expect(createButton).toBeEnabled();
        await createButton.click();
        await expect(page).toHaveURL(/\/purchase$/);
        const row = rowOf(invoice);
        await expect(row).toBeVisible();
        await expect(row).toContainText(SUPPLIER);
        await expect(row).toContainText("SMALL_BALES");
        await expect(row).toContainText("50");
        await expect(row).toContainText("120");
        await expect(row).toContainText("PENDING");
      });

      // 6. Reload; GET /api/purchase/{id}
      await test.step("The saved purchase has total 120, surcharge 50, exactly the 2 lines as typed, and is PENDING", async () => {
        await page.reload();
        await expect(rowOf(invoice)).toBeVisible();
        const listed = await po.findByInvoice(request, invoice);
        const saved = await po.getPurchase(request, listed.id);
        expect(saved.status).toBe("PENDING");
        expect(Number(saved.totalAmount)).toBe(120);
        expect(Number(saved.surCharge)).toBe(50);
        expect(saved.companyId).toBe(companyId);
        expect(saved.baleType).toBe("SMALL_BALES");
        expect(saved.purchasedProducts).toHaveLength(2);
        const lineA = saved.purchasedProducts.find((l) => l.id === itemA.id);
        const lineB = saved.purchasedProducts.find((l) => l.id === itemB.id);
        expect(Number(lineA?.noOfBales)).toBe(3);
        expect(Number(lineA?.ratePerBale)).toBe(10);
        expect(Number(lineB?.noOfBales)).toBe(2);
        expect(Number(lineB?.ratePerBale)).toBe(20);
      });

      // 7. GET /api/inventory and the company ledger
      await test.step("Stock, supplier balance and entry count are unchanged", async () => {
        await expectStockAndLedgerUnchanged();
      });

      // 8. Create a second purchase with one line (A: 2 bales x Rs 10/bale), no invoice, Sur Charge 0
      await test.step("The second purchase saves without error as PENDING, with no invoice number and total 20", async () => {
        const before = await po.listPurchases(request);
        const idsBefore = new Set(before.rows.map((r) => r.id));

        await page.goto("/purchase/create");
        await antSelect(page, "Company", SUPPLIER);
        await antSelect(page, "List Type", "SMALL_BALES");
        await page.getByRole("button", { name: "Edit All" }).click();
        const rowA = rowOf(itemA.itemName);
        await rowA.getByRole("spinbutton").first().fill("2");
        await rowA.getByRole("spinbutton").last().fill("10");
        await page.getByRole("button", { name: "Save All" }).click();
        await expect(totalAmount).toHaveValue("20");
        await createButton.click();
        await expect(page).toHaveURL(/\/purchase$/);

        const after = await po.listPurchases(request);
        expect(after.count).toBe(before.count + 1);
        const created = after.rows.filter((r) => !idsBefore.has(r.id));
        expect(created).toHaveLength(1);

        await page.reload();
        const row = page.getByRole("row").filter({
          has: page.getByRole("link", { name: String(created[0].id), exact: true }),
        });
        await expect(row).toContainText("N/A");
        await expect(row).toContainText("PENDING");

        const saved = await po.getPurchase(request, created[0].id);
        expect(saved.status).toBe("PENDING");
        expect(saved.invoiceNumber).toBeNull();
        expect(Number(saved.totalAmount)).toBe(20);
        expect(saved.purchasedProducts).toHaveLength(1);
        expect(saved.purchasedProducts[0].id).toBe(itemA.id);
        expect(Number(saved.purchasedProducts[0].noOfBales)).toBe(2);
        await expectStockAndLedgerUnchanged();
      });
    }
  );
});
