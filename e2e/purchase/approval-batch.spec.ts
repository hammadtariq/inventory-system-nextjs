import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

// Cases: specs/cases/purchase-approval-batch.csv (#257). Approval now locks every stock row in one read and
// writes each row once; these cases guard that batch path at real invoice size.

type APIRequestContext = Parameters<typeof po.ledger>[0];

const ADMIN_STATE = "playwright/.auth/admin.json";
const LINES = 50;
const STOCKED = 25;

/**
 * A supplier of the test's own with 50 items: 00-24 in stock at 5 bales × 20 kg (one approved opening purchase,
 * Rs 25,000), 25-49 never stocked. Then a PENDING purchase of all 50: line i has (i mod 7) + 2 bales; even lines
 * are weight-priced (15 + i mod 5 kg per bale at Rs 12/kg), odd lines per bale (Rs 100 + i). Total Rs 40,698.
 */
async function largePurchase(request: APIRequestContext, tag: string) {
  const supplier = await po.newSupplier(request, `${tag}-supplier`);
  const items: po.Item[] = [];
  for (let i = 0; i < LINES; i++) {
    const n = String(i).padStart(2, "0");
    items.push(await po.createItem(request, supplier.id, "BIG_BALES", { tag: `${tag}-i${n}`, ratePerKgs: 10 }));
  }

  const opening = await po.createPurchase(request, {
    companyId: supplier.id,
    baleType: "BIG_BALES",
    lines: items.slice(0, STOCKED).map((item) => po.line(item, 5, { kg: 20, perKg: 10 })),
  });
  expect(opening.totalAmount).toBe(25_000);
  await po.approveOk(request, opening.id);

  const lines = items.map((item, i) =>
    i % 2 === 0
      ? po.line(item, (i % 7) + 2, { kg: 15 + (i % 5), perKg: 12 })
      : po.line(item, (i % 7) + 2, { perBale: 100 + i })
  );
  const purchase = await po.createPurchase(request, { companyId: supplier.id, baleType: "BIG_BALES", lines });
  expect(purchase.totalAmount).toBe(40_698);

  return { supplier, items, lines, purchase };
}

/** On-hand bales of every item, in order (0 for an item with no stock row). One at a time: 50 parallel reads
 * overrun the dev server's connection pool. */
async function stockOfAll(request: APIRequestContext, items: po.Item[]) {
  const stock: number[] = [];
  for (const item of items) stock.push((await po.stockOf(request, item.id)) ?? 0);
  return stock;
}

test(
  "Approving a 50-line purchase adds every line's bales and charges once",
  { annotation: tr("C1592"), tag: "@smoke" },
  async ({ page, request }) => {
    test.slow(); // 50 items and two purchases are created through the API first.
    const { supplier, items, lines, purchase } = await largePurchase(request, "pab01");
    let before: number[] = [];

    await test.step("Before approval: 25 items at 5 bales, 25 never stocked, balance Rs 25,000", async () => {
      before = await stockOfAll(request, items);
      expect(before).toEqual(items.map((_, i) => (i < STOCKED ? 5 : 0)));
      expect((await po.ledger(request, supplier.id)).balance).toBeCloseTo(25_000, 2);
    });

    await test.step("The owner approves the purchase from the purchase list: APPROVED", async () => {
      await po.approveFromList(page, purchase.invoiceNumber!);
      expect((await po.getPurchase(request, purchase.id)).status).toBe("APPROVED");
    });

    await test.step("Every line's bales reach stock: stocked items rise, new items show their bales", async () => {
      const after = await stockOfAll(request, items);
      expect(after).toEqual(items.map((_, i) => before[i] + lines[i].noOfBales));
      expect([after[0], after[1], after[25]]).toEqual([7, 8, 6]);
    });

    await test.step("The supplier statement has one new DEBIT of Rs 40,698 and a balance of Rs 65,698", async () => {
      const after = await po.ledger(request, supplier.id);
      expect(po.entriesFor(after.rows, purchase.id).map((e) => [e.spendType, e.amount])).toEqual([["DEBIT", 40_698]]);
      expect(after.entries).toBe(2);
      expect(after.balance).toBeCloseTo(65_698, 2);
    });

    await test.step("The owner's screens agree: item 01 shows 8 on hand, the supplier Rs 65,698.00", async () => {
      await page.goto("/inventory");
      const search = page.getByPlaceholder("search inventory");
      await search.fill(items[1].itemName);
      await expect(page.getByText(`(${supplier.name})`).filter({ visible: true })).toBeVisible();
      await search.press("ArrowDown");
      await search.press("Enter");
      const row = page.getByRole("row").filter({ hasText: items[1].itemName });
      await expect(row.getByRole("cell").nth(2)).toHaveText("8");

      await page.goto(`/ledger?type=company&search=${encodeURIComponent(supplier.name)}`);
      // The supplier's own card: the innermost element holding both its name and "Total Balance".
      const card = page
        .locator("div")
        .filter({ has: page.getByText(supplier.name, { exact: true }) })
        .filter({ hasText: "Total Balance" })
        .last();
      await expect(card).toContainText("65,698.00");
    });
  }
);

test(
  "Re-approving a revised large purchase applies only the differences",
  { annotation: tr("C1593"), tag: "@smoke" },
  async ({ page, request }) => {
    test.slow();
    const { supplier, items, lines, purchase } = await largePurchase(request, "pab02");
    await po.approveOk(request, purchase.id);
    const item50 = await po.createItem(request, supplier.id, "BIG_BALES", { tag: "pab02-i50", ratePerKgs: 10 });
    let approved: number[] = [];

    // +3 bales on items 00-02, -1 on 03-04, item 49 removed, never-stocked item 50 added (4 × 18 kg × Rs 11/kg).
    const revised = [
      ...lines
        .slice(0, 49)
        .map((l, i) =>
          i < 3 ? { ...l, noOfBales: l.noOfBales + 3 } : i < 5 ? { ...l, noOfBales: l.noOfBales - 1 } : l
        ),
      po.line(item50, 4, { kg: 18, perKg: 11 }),
    ];
    const bump = (i: number) => (i < 3 ? 3 : i < 5 ? -1 : 0);

    await test.step("Given the approved purchase: Rs 40,698, balance Rs 65,698", async () => {
      approved = await stockOfAll(request, items);
      expect([approved[0], approved[3], approved[49]]).toEqual([7, 10, 2]);
      expect((await po.ledger(request, supplier.id)).balance).toBeCloseTo(65_698, 2);
      expect(po.purchaseTotal(revised)).toBe(42_316);
    });

    await test.step("The owner revises it: PENDING at revision 1; stock and balance unchanged", async () => {
      await po.revise(request, await po.getPurchase(request, purchase.id), revised);
      const p = await po.getPurchase(request, purchase.id);
      expect([p.status, p.revisionNo, p.totalAmount]).toEqual(["PENDING", 1, 42_316]);
      expect(await stockOfAll(request, items)).toEqual(approved);
      expect(await po.stockOf(request, item50.id)).toBeNull();
      expect((await po.ledger(request, supplier.id)).balance).toBeCloseTo(65_698, 2);
    });

    await test.step("The owner approves it again: only the changed lines move, item 50 shows 4", async () => {
      await po.approveFromList(page, purchase.invoiceNumber!);
      const after = await stockOfAll(request, items);
      expect(after.slice(0, 49)).toEqual(approved.slice(0, 49).map((s, i) => s + bump(i)));
      expect([after[0], after[3]]).toEqual([10, 9]);
      expect(await po.stockOf(request, item50.id)).toBe(4);
    });

    await test.step("Still one supplier entry for the purchase, now Rs 42,316; balance Rs 67,316", async () => {
      const after = await po.ledger(request, supplier.id);
      expect(po.entriesFor(after.rows, purchase.id).map((e) => [e.spendType, e.amount])).toEqual([["DEBIT", 42_316]]);
      expect(after.entries).toBe(2);
      expect(after.balance).toBeCloseTo(67_316, 2);
    });

    // Own step so a failure here doesn't hide the checks above (Q1 in specs/purchase-approval-batch.md).
    await test.step("The removed item 49 goes back to 0 bales", async () => {
      expect(await po.stockOf(request, items[49].id)).toBe(0);
    });
  }
);

test(
  "Two purchases sharing items, approved at the same moment, both reach stock",
  { annotation: tr("C1594") },
  async ({ request, playwright, baseURL }) => {
    const supplier = (await po.newSupplier(request, "pab03-supplier")).id;
    const a = await po.stockedItem(request, supplier, "pab03-a", 10);
    const b = await po.stockedItem(request, supplier, "pab03-b", 10);
    // Opposite line order: approval locks stock rows in id order, so these two must not deadlock.
    const p1 = await po.createPurchase(request, {
      companyId: supplier,
      baleType: "BIG_BALES",
      lines: [po.line(a, 3, { kg: 10, perKg: 10 }), po.line(b, 2, { kg: 10, perKg: 10 })], // 300 + 200
    });
    const p2 = await po.createPurchase(request, {
      companyId: supplier,
      baleType: "BIG_BALES",
      lines: [po.line(b, 4, { kg: 10, perKg: 10 }), po.line(a, 5, { kg: 10, perKg: 10 })], // 400 + 500
    });
    const secondAdmin = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE });

    try {
      await test.step("Given A and B each have 10 bales in stock", async () => {
        expect([await po.stockOf(request, a.id), await po.stockOf(request, b.id)]).toEqual([10, 10]);
      });

      await test.step("The owner and a second admin approve P1 and P2 at the same moment: both APPROVED", async () => {
        const results = await Promise.all([po.approve(request, p1.id), po.approve(secondAdmin, p2.id)]);
        for (const r of results) expect(r.status(), await r.text()).toBe(200);
        expect((await po.getPurchase(request, p1.id)).status).toBe("APPROVED");
        expect((await po.getPurchase(request, p2.id)).status).toBe("APPROVED");
      });

      await test.step("A shows 18 bales and B shows 16; each purchase has one DEBIT for its own total", async () => {
        expect([await po.stockOf(request, a.id), await po.stockOf(request, b.id)]).toEqual([18, 16]);
        // Not the balance: two approvals for one supplier race on it (D11, #220, covered by C62).
        const { rows } = await po.ledger(request, supplier);
        expect(po.entriesFor(rows, p1.id).map((e) => e.amount)).toEqual([500]);
        expect(po.entriesFor(rows, p2.id).map((e) => e.amount)).toEqual([900]);
      });
    } finally {
      await secondAdmin.dispose();
    }
  }
);
