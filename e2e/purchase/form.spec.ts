// spec: specs/purchase-orders.md (2.2 C55)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

const SUPPLIER_A = "Ironwood Imports";

test.describe("Input integrity", () => {
  test(
    "Switching company or bale type while creating leaves only the new selection's items and recalculates totals",
    { annotation: tr("C55") },
    async ({ page, request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #229: lines typed before a bale-type switch come back and are saved with the purchase."
      );
      // Setup: supplier A gets one SMALL_BALES item; a new supplier B gets two SMALL_BALES items and one BIG_BALES item.
      const companyA = await po.companyId(request, SUPPLIER_A);
      const itemA = await po.createItem(request, companyA, "SMALL_BALES", { tag: "c55-a" });

      const supplierB = po.uid("c55-supplier");
      const created = await request.post("/api/company", { data: { companyName: supplierB } });
      expect(created.status(), await created.text()).toBe(200);
      const companyB = await po.companyId(request, supplierB);
      const smallB1 = await po.createItem(request, companyB, "SMALL_BALES", { tag: "c55-b1" });
      const smallB2 = await po.createItem(request, companyB, "SMALL_BALES", { tag: "c55-b2" });
      const bigB = await po.createItem(request, companyB, "BIG_BALES", { tag: "c55-big" });
      const invoice = po.uid("c55-inv");

      const rowOf = (name: string) => page.getByRole("row").filter({ hasText: name });
      const totalAmount = page.getByLabel("Total Amount (RS)");
      const totalBundles = page.getByLabel("Total Bundle(s)");

      const fillAndSave = async (itemName: string, bales: string, ratePerBale: string) => {
        await page.getByRole("button", { name: "Edit All" }).click();
        const row = rowOf(itemName);
        await row.getByRole("spinbutton").first().fill(bales);
        await row.getByRole("spinbutton").last().fill(ratePerBale);
        await page.getByRole("button", { name: "Save All" }).click();
      };

      // 1. Company A, SMALL_BALES, fill a row
      await test.step("The totals reflect the filled row (30 and 3 bundles)", async () => {
        await page.goto("/purchase/create");
        await antSelect(page, "Company", SUPPLIER_A);
        await antSelect(page, "List Type", "SMALL_BALES");
        await expect(rowOf(itemA.itemName)).toBeVisible();
        await fillAndSave(itemA.itemName, "3", "10");
        await expect(rowOf(itemA.itemName)).toBeVisible();
        await expect(totalBundles).toHaveValue("3");
        await expect(totalAmount).toHaveValue("30");
      });

      // 2. Switch to company B
      await test.step("Only B's SMALL_BALES items are listed and the totals reset to 0", async () => {
        await antSelect(page, "Company", supplierB);
        await expect(rowOf(smallB1.itemName)).toBeVisible();
        await expect(rowOf(smallB2.itemName)).toBeVisible();
        await expect(rowOf(itemA.itemName)).toHaveCount(0);
        await expect(rowOf(bigB.itemName)).toHaveCount(0);
        await expect(totalBundles).toHaveValue("0");
        await expect(totalAmount).toHaveValue("0");
      });

      // 3. Fill a B row, then switch List Type to BIG_BALES
      await test.step("Only B's BIG_BALES item is listed and the totals reset to 0", async () => {
        await fillAndSave(smallB1.itemName, "2", "20");
        await expect(totalBundles).toHaveValue("2");
        await expect(totalAmount).toHaveValue("40");

        await antSelect(page, "List Type", "BIG_BALES");
        await expect(rowOf(bigB.itemName)).toBeVisible();
        await expect(rowOf(smallB1.itemName)).toHaveCount(0);
        await expect(rowOf(smallB2.itemName)).toHaveCount(0);
        await expect(totalBundles).toHaveValue("0");
        await expect(totalAmount).toHaveValue("0");
      });

      // 4. Switch back to SMALL_BALES, fill a B row; create; reload; GET
      await test.step("The saved purchase is for B, SMALL_BALES, with only that item and a matching total", async () => {
        await antSelect(page, "List Type", "SMALL_BALES");
        await expect(rowOf(smallB2.itemName)).toBeVisible();
        await fillAndSave(smallB2.itemName, "4", "5");
        // Only the row filled after switching back counts: nothing typed before the switch may come back.
        await expect.soft(totalBundles).toHaveValue("4");
        await expect.soft(totalAmount).toHaveValue("20");

        await page.getByLabel("Invoice No").fill(invoice);
        await page.getByRole("button", { name: "Create Purchase" }).click();
        await expect(page).toHaveURL(/\/purchase$/);

        await page.reload();
        await expect(rowOf(invoice)).toBeVisible();
        const listed = await po.findByInvoice(request, invoice);
        const saved = await po.getPurchase(request, listed.id);
        expect(saved.companyId).toBe(companyB);
        expect(saved.baleType).toBe("SMALL_BALES");
        expect(saved.status).toBe("PENDING");
        expect
          .soft(saved.purchasedProducts.map((l) => [l.id, Number(l.noOfBales), Number(l.ratePerBale)]))
          .toEqual([[smallB2.id, 4, 5]]);
        expect.soft(Number(saved.totalAmount)).toBe(20);
      });
    }
  );
});
