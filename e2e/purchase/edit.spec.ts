import { test, expect, tr } from "../fixtures";
import { antSelectByPlaceholder } from "../support/antd";
import * as po from "../support/purchase-api";

test(
  "Editing a PENDING purchase saves only the kept items and values, creates no duplicate, and still posts nothing",
  { annotation: tr("C21"), tag: "@smoke" },
  async ({ page, request }) => {
    // An own supplier: parallel tests post to the seeded ones and would move its counts.
    const imports = (await po.newSupplier(request, "c21-supplier")).id;
    const a = await po.createItem(request, imports, "SMALL_BALES", { tag: "c21-a" });
    const b = await po.createItem(request, imports, "SMALL_BALES", { tag: "c21-b" });
    const p = await po.createPurchase(request, {
      companyId: imports,
      baleType: "SMALL_BALES",
      lines: [po.line(a, 5, { perBale: 10 }), po.line(b, 2, { perBale: 20 })], // 50 + 40
    });
    const count = await po.purchaseCount(request, imports);
    const stockA = await po.stockOf(request, a.id);
    const stockB = await po.stockOf(request, b.id);
    const before = await po.ledger(request, imports);
    const newInvoice = po.uid("c21-inv");

    const rowOf = (name: string) => page.getByRole("row").filter({ hasText: name });
    const totalAmount = page.getByLabel("Total Amount (RS)");
    const totalBundles = page.getByLabel("Total Bundle(s)");

    await test.step("Open the edit page: prefilled with total 90 and 7 bundles", async () => {
      await page.goto(`/purchase/${p.id}`);
      await expect(page.getByRole("heading", { name: "Update Purchase Order" })).toBeVisible();
      await expect(totalAmount).toHaveValue("90");
      await expect(totalBundles).toHaveValue("7");
    });

    await test.step("Remove B: its row goes, 5 bundles, 'Add Removed Items' enabled", async () => {
      await rowOf(b.itemName).getByText("Remove", { exact: true }).click();
      await expect(rowOf(b.itemName)).toHaveCount(0);
      await expect(totalBundles).toHaveValue("5");
      await expect(page.getByText("Add Removed Items")).toBeVisible();
    });

    await test.step("Restore B with 'Add Removed Items' and Apply: its row is back, 7 bundles", async () => {
      await antSelectByPlaceholder(page, "Add Removed Items", b.itemName);
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(rowOf(b.itemName)).toBeVisible();
      await expect(totalBundles).toHaveValue("7");
    });

    await test.step("Remove B again, A to 8 bales, Sur Charge 40, new invoice: total 120", async () => {
      await rowOf(b.itemName).getByText("Remove", { exact: true }).click();
      await page.getByRole("button", { name: "Edit All" }).click();
      await rowOf(a.itemName).getByRole("spinbutton").nth(po.FORM_INPUT.bales).fill("8");
      await page.getByRole("button", { name: "Save All" }).click();
      await page.getByLabel("Sur Charge (RS)").fill("40");
      await page.getByLabel("Invoice No").fill(newInvoice);
      await expect(totalAmount).toHaveValue("120");
    });

    await test.step("Update Purchase: the row shows the new invoice, Sur Charge 40, total 120, PENDING", async () => {
      await page.getByRole("button", { name: "Update Purchase" }).click();
      await expect(page).toHaveURL(/\/purchase$/);
      await page.reload();
      const row = rowOf(newInvoice);
      await expect(row).toContainText("40");
      await expect(row).toContainText("120");
      await expect(row).toContainText("PENDING");
    });

    await test.step("Saved: PENDING, revision 0, only A with 8 bales, 120; no duplicate purchase", async () => {
      const saved = await po.getPurchase(request, p.id);
      expect(saved.status).toBe("PENDING");
      expect(saved.revisionNo).toBe(0);
      expect(saved.invoiceNumber).toBe(newInvoice);
      expect(Number(saved.totalAmount)).toBe(120);
      expect(saved.purchasedProducts.map((l) => [l.id, Number(l.noOfBales), Number(l.ratePerBale)])).toEqual([
        [a.id, 8, 10],
      ]);
      expect(await po.purchaseCount(request, imports)).toBe(count);
      expect(await po.withInvoice(request, newInvoice)).toHaveLength(1);
    });

    await test.step("Stock and the supplier ledger are unchanged", async () => {
      expect(await po.stockOf(request, a.id)).toBe(stockA);
      expect(await po.stockOf(request, b.id)).toBe(stockB);
      const after = await po.ledger(request, imports);
      expect(after.entries).toBe(before.entries);
      expect(after.balance).toBeCloseTo(before.balance, 2);
    });
  }
);
