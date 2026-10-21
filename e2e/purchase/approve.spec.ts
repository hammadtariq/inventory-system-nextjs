import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "Approving a purchase adds its bales to stock and posts one DEBIT, exactly once",
  { annotation: tr("C12"), tag: "@smoke" },
  async ({ page, request }) => {
    // Own suppliers: parallel tests post to the seeded ones. "handbags" is already in stock, like the seeded item.
    const garments = (await po.newSupplier(request, "c12-supplier")).id;
    const imports = (await po.newSupplier(request, "c12-other")).id;
    const handbags = await po.stockedItem(request, garments, "c12-handbags");
    const n = await po.createItem(request, garments, "BIG_BALES", { tag: "c12", ratePerKgs: 10 });
    const p = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(handbags, 5, { kg: 20, perKg: 5 }), po.line(n, 7, { kg: 10, perKg: 10 })], // 500 + 700
    });
    expect(Number(p.totalAmount)).toBe(1200);
    const row = page.getByRole("row").filter({ hasText: p.invoiceNumber! });
    let stockHandbags = 0;
    let before!: Awaited<ReturnType<typeof po.ledger>>;
    let otherBefore = 0;
    let afterApproval!: { handbags: number | null; n: number | null; ledger: Awaited<ReturnType<typeof po.ledger>> };

    await test.step("Before approval the new item has no stock row", async () => {
      stockHandbags = (await po.stockOf(request, handbags.id)) ?? 0;
      before = await po.ledger(request, garments);
      otherBefore = (await po.ledger(request, imports)).balance;
      expect(await po.stockOf(request, n.id)).toBeNull();
    });

    await test.step("Approve from the list: APPROVED, approve and cancel actions gone", async () => {
      await page.goto("/purchase");
      await row.getByRole("img", { name: "check" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await expect(row).toContainText("APPROVED");
      await expect(row.getByRole("img", { name: "check" })).toHaveCount(0);
      await expect(row.getByRole("img", { name: "close" })).toHaveCount(0);
    });

    await test.step("Stock: the stocked item + 5 (added, not replaced); the new item has a row with 7", async () => {
      expect(await po.stockOf(request, handbags.id)).toBe(stockHandbags + 5);
      expect(await po.stockOf(request, n.id)).toBe(7);
    });

    await test.step("Supplier ledger: one new DEBIT of 1200 for the purchase; balance + 1200", async () => {
      const after = await po.ledger(request, garments);
      const entries = po.entriesFor(after.rows, p.id);
      expect(entries.map((e) => [e.spendType, e.amount])).toEqual([["DEBIT", 1200]]);
      expect(after.entries).toBe(before.entries + 1);
      expect(after.balance).toBeCloseTo(before.balance + 1200, 2);
      afterApproval = {
        handbags: await po.stockOf(request, handbags.id),
        n: await po.stockOf(request, n.id),
        ledger: after,
      };
    });

    await test.step("Another supplier's ledger is unchanged", async () => {
      expect((await po.ledger(request, imports)).balance).toBeCloseTo(otherBefore, 2);
    });

    await test.step("Approving again is refused and nothing moves", async () => {
      const again = await po.approve(request, p.id);
      expect(again.status()).toBe(400);
      expect((await again.json()).message).toBe("Purchase order already approved");
      expect(await po.stockOf(request, handbags.id)).toBe(afterApproval.handbags);
      expect(await po.stockOf(request, n.id)).toBe(afterApproval.n);
      const now = await po.ledger(request, garments);
      expect(now.entries).toBe(afterApproval.ledger.entries);
      expect(now.balance).toBeCloseTo(afterApproval.ledger.balance, 2);
    });
  }
);
