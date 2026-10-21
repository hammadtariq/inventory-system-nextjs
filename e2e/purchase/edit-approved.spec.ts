import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "Revising an approved purchase records the change and re-approval moves stock and ledger by the difference only",
  { annotation: tr("C23"), tag: "@smoke" },
  async ({ page, request }) => {
    const garments = await po.companyId(request, "Ironwood Garments");
    const handbags = await po.seededItem(request, garments, "BIG_BALES", "handbags mixed");
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c23", ratePerKgs: 5 });
    const stockX = (await po.stockOf(request, x.id)) ?? 0;
    const stockH = (await po.stockOf(request, handbags.id)) ?? 0;
    const b0 = (await po.ledger(request, garments)).balance;
    const p = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 10, { kg: 10, perKg: 5 }), po.line(handbags, 5, { kg: 10, perKg: 10 })], // 500 + 500
    });
    await po.approveOk(request, p.id);
    const entriesAfterFirstApproval = (await po.ledger(request, garments)).entries;
    const rowOf = (name: string) => page.getByRole("row").filter({ hasText: name });
    const listRow = rowOf(p.invoiceNumber!);

    await test.step("Edit in the UI: X 15 bales, 'handbags mixed' 3; it returns to PENDING with approve/cancel back", async () => {
      await page.goto(`/purchase/${p.id}`);
      await page.getByRole("button", { name: "Edit All" }).click();
      await rowOf(x.itemName).getByRole("spinbutton").nth(po.FORM_INPUT.bales).fill("15");
      await rowOf(handbags.itemName).getByRole("spinbutton").nth(po.FORM_INPUT.bales).fill("3");
      await page.getByRole("button", { name: "Save All" }).click();
      await page.getByRole("button", { name: "Update Purchase" }).click();
      await expect(page).toHaveURL(/\/purchase$/);
      await page.reload();
      await expect(listRow).toContainText("PENDING");
      await expect(listRow.getByRole("img", { name: "check" })).toBeVisible();
      await expect(listRow.getByRole("img", { name: "close" })).toBeVisible();
    });

    await test.step("Saved: revision 1 recording X +5 and 'handbags mixed' -2 from 10 and 5", async () => {
      const saved = await po.getPurchase(request, p.id);
      expect(saved.revisionNo).toBe(1);
      const change = (id: number) => saved.revisionDetails.purchasedProducts.find((l: po.Line) => Number(l.id) === id);
      expect(change(x.id).noOfBales).toBe(5);
      expect(change(handbags.id).noOfBales).toBe(-2);
      const previous = (id: number) =>
        saved.revisionDetails.previousPurchasedProducts.find((l: po.Line) => Number(l.id) === id);
      expect(previous(x.id).noOfBales).toBe(10);
      expect(previous(handbags.id).noOfBales).toBe(5);
      if (po.knownBug("#222", "the form saves weight-priced totals without the bale count")) {
        expect.soft(Number(saved.totalAmount)).toBe(1050);
      }
    });

    await test.step("Approve from the list: APPROVED, revision 1", async () => {
      await listRow.getByRole("img", { name: "check" }).click();
      await page.getByRole("button", { name: "Yes" }).click();
      await expect(listRow).toContainText("APPROVED");
      const saved = await po.getPurchase(request, p.id);
      expect(saved.status).toBe("APPROVED");
      expect(saved.revisionNo).toBe(1);
    });

    await test.step("Stock moves by the difference only; the purchase keeps one ledger entry", async () => {
      expect(await po.stockOf(request, x.id)).toBe(stockX + 15);
      expect(await po.stockOf(request, handbags.id)).toBe(stockH + 3);
      const now = await po.ledger(request, garments);
      expect(now.entries).toBe(entriesAfterFirstApproval);
      expect(po.entriesFor(now.rows, p.id)).toHaveLength(1);
      if (po.knownBug("#222", "the entry follows the form's weight-priced total")) {
        expect.soft(po.entriesFor(now.rows, p.id)[0].amount).toBe(1050);
        expect.soft(now.balance).toBeCloseTo(b0 + 1050, 2);
      }
    });

    await test.step("Revise again via the API (X 12, total 900) and approve: revision 2, stock and entry follow", async () => {
      await po.revise(request, await po.getPurchase(request, p.id), [
        po.line(x, 12, { kg: 10, perKg: 5 }),
        po.line(handbags, 3, { kg: 10, perKg: 10 }),
      ]);
      await po.approveOk(request, p.id);
      expect((await po.getPurchase(request, p.id)).revisionNo).toBe(2);
      expect(await po.stockOf(request, x.id)).toBe(stockX + 12);
      expect(await po.stockOf(request, handbags.id)).toBe(stockH + 3);
      const now = await po.ledger(request, garments);
      expect(po.entriesFor(now.rows, p.id).map((e) => e.amount)).toEqual([900]);
      expect(now.balance).toBeCloseTo(b0 + 900, 2);
    });
  }
);
