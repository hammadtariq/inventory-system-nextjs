import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "Cancelling a never-approved PENDING purchase sets CANCEL without changing stock or ledger",
  { annotation: tr("C15"), tag: "@smoke" },
  async ({ page, request }) => {
    // An own supplier (parallel tests post to the seeded ones) and an item already in stock.
    const garments = (await po.newSupplier(request, "c15-supplier")).id;
    const handbags = await po.stockedItem(request, garments, "c15-handbags");
    const p = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(handbags, 5, { kg: 16, perKg: 10 })], // 800
    });
    const stock = await po.stockOf(request, handbags.id);
    const before = await po.ledger(request, garments);
    const row = page.getByRole("row").filter({ hasText: p.invoiceNumber! });

    await test.step("Cancel from the list: CANCEL, approve and cancel actions gone", async () => {
      await page.goto("/purchase");
      await row.getByRole("img", { name: "close" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await expect(row).toContainText("CANCEL");
      await expect(row.getByRole("img", { name: "check" })).toHaveCount(0);
      await expect(row.getByRole("img", { name: "close" })).toHaveCount(0);
    });

    await test.step("The saved purchase is CANCEL", async () => {
      expect((await po.getPurchase(request, p.id)).status).toBe("CANCEL");
    });

    await test.step("Stock and the supplier ledger are unchanged", async () => {
      expect(await po.stockOf(request, handbags.id)).toBe(stock);
      const after = await po.ledger(request, garments);
      expect(after.entries).toBe(before.entries);
      expect(after.balance).toBeCloseTo(before.balance, 2);
      expect(po.entriesFor(after.rows, p.id)).toEqual([]);
    });
  }
);
