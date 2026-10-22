// spec: specs/companies-crud.md (CO-08 C514, CO-09 C515, CO-10 C516)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antCombobox, antOptionsMatching } from "../support/antd";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";

const HAS_ITEMS = (n: number) => `${n} items exist against this company. Please remove dependencies first.`;

test.describe("Delete a supplier", () => {
  test(
    "The owner can delete a supplier with no history; it disappears from the list and every picker, and its id then gives 404",
    { annotation: tr("C514") },
    async ({ page, request }) => {
      const d = await co.createSupplier(request, "Delete Me");
      const row = await co.companyRow(page, d.companyName);

      // 1. Delete, then "No" in the confirmation
      await test.step("Answering No keeps D", async () => {
        await row.getByRole("button", { name: "Delete" }).click();
        await page.getByRole("button", { name: "No" }).click();
        await expect(row).toBeVisible();
        expect((await request.get(`/api/company/${d.id}`)).status()).toBe(200);
      });

      // 2. Delete, then "Yes"
      await test.step("Answering Yes removes D from the list", async () => {
        await row.getByRole("button", { name: "Delete" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        await expect(row).toHaveCount(0);
      });

      // 3. GET /api/company/{D}; the purchase form's company picker
      await test.step("D's id gives 404 and the purchase picker doesn't offer D", async () => {
        const res = await request.get(`/api/company/${d.id}`);
        expect(res.status()).toBe(404);
        expect(((await res.json()) as { message: string }).message).toBe("company not exist");
        await co.openWithCompanyPicker(page, "/purchase/create");
        await expect(await antOptionsMatching(page, antCombobox(page, "Company"), d.companyName)).toHaveCount(0);
      });
    }
  );

  test(
    "A supplier that still has items can't be deleted, and its items, stock and ledger stay intact",
    { annotation: tr("C515"), tag: "@smoke" },
    async ({ page, request }) => {
      const s = await co.createSupplier(request, "Has Items");
      const stocked = await po.stockedItem(request, s.id, "c515", 3);
      await po.createItem(request, s.id, "BIG_BALES", { tag: "c515-second", ratePerKgs: 10 });
      const ledgerBefore = await po.ledger(request, s.id);

      // 1. Delete from the list and confirm
      await test.step("The list refuses with '2 items exist…' and S stays listed", async () => {
        const row = await co.companyRow(page, s.companyName);
        await row.getByRole("button", { name: "Delete" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        await expect(page.getByText(HAS_ITEMS(2))).toBeVisible();
        await page.reload();
        await expect(await co.companyRow(page, s.companyName)).toBeVisible();
      });

      // 2. DELETE /api/company/{S}
      await test.step("The API refuses with the same message", async () => {
        const res = await request.delete(`/api/company/${s.id}`);
        expect(res.ok()).toBe(false);
        expect(((await res.json()) as { message: string }).message).toBe(HAS_ITEMS(2));
        if (po.knownBug("#251", "a delete refused for dependencies returns 404; it should be 409"))
          expect(res.status()).toBe(409);
      });

      // 3. S, its items, stock and ledger
      await test.step("S, both items, on-hand 3 and the ledger are unchanged", async () => {
        expect((await co.getCompany(request, s.id)).companyName).toBe(s.companyName);
        expect(await po.items(request, s.id, "BIG_BALES")).toHaveLength(2);
        expect(await po.stockOf(request, stocked.id)).toBe(3);
        const after = await po.ledger(request, s.id);
        expect(after.entries).toBe(ledgerBefore.entries);
        expect(after.balance).toBe(ledgerBefore.balance);
      });
    }
  );

  test(
    "A supplier with purchases or payments can't be deleted even when it has no items, and its ledger and purchase history stay intact",
    { annotation: tr("C516"), tag: "@smoke" },
    async ({ request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #247 (owner Q1, Q2): company delete only counts items, and item delete has no dependency check; deleting cascades purchase history and orphans purchases and ledger rows."
      );

      // Row "payment only": a supplier with one Rs 500 payment, no items or purchases
      await test.step("payment only: the supplier can't be deleted and its ledger is unchanged", async () => {
        const s = await co.createSupplier(request, "Paid Only");
        await po.payCompany(request, s.id, 500);
        const before = await po.ledger(request, s.id);
        expect.soft(before.entries).toBe(1);

        const res = await request.delete(`/api/company/${s.id}`);
        expect.soft(res.ok(), "company delete refused").toBe(false);
        expect.soft((await request.get(`/api/company/${s.id}`)).status(), "supplier still exists").toBe(200);
        const after = await po.ledger(request, s.id);
        expect.soft(after.entries).toBe(before.entries);
        expect.soft(after.balance).toBe(before.balance);
      });

      // Row "items deleted first": an item in an APPROVED, then revised purchase; delete the item, then the supplier
      await test.step("items deleted first: item and supplier deletes are refused; history, purchases, stock and ledger unchanged", async () => {
        const s = await co.createSupplier(request, "Items First");
        const item = await po.createItem(request, s.id, "BIG_BALES", { tag: "c516", ratePerKgs: 10 });
        const p = await po.createPurchase(request, {
          companyId: s.id,
          baleType: "BIG_BALES",
          lines: [po.line(item, 4, { kg: 10, perKg: 10 })],
        });
        await po.approveOk(request, p.id);
        await po.revise(request, await po.getPurchase(request, p.id), [po.line(item, 5, { kg: 10, perKg: 10 })]);
        const organizationId = (p as any).organizationId as number;
        const historyBefore = await co.historyCount(organizationId, p.id);
        expect.soft(historyBefore, "the revision recorded history").toBeGreaterThan(0);
        const stockBefore = await po.stockOf(request, item.id);
        const ledgerBefore = await po.ledger(request, s.id);

        const itemRes = await request.delete(`/api/items/${item.id}`);
        expect.soft(itemRes.ok(), "item delete refused (owner Q2)").toBe(false);
        const companyRes = await request.delete(`/api/company/${s.id}`);
        expect.soft(companyRes.ok(), "company delete refused (owner Q1)").toBe(false);

        expect.soft((await request.get(`/api/company/${s.id}`)).status(), "supplier still exists").toBe(200);
        expect.soft((await po.listPurchases(request, s.id)).rows.map((r) => r.id)).toEqual([p.id]);
        expect.soft(await co.historyCount(organizationId, p.id), "purchase history").toBe(historyBefore);
        expect
          .soft(
            (await po.items(request, s.id, "BIG_BALES")).map((i) => i.id),
            "item"
          )
          .toEqual([item.id]);
        expect.soft(await po.stockOf(request, item.id), "stock row").toBe(stockBefore);
        const ledgerAfter = await po.ledger(request, s.id);
        expect.soft(ledgerAfter.entries).toBe(ledgerBefore.entries);
        expect.soft(ledgerAfter.balance).toBe(ledgerBefore.balance);
      });
    }
  );
});
