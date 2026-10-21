import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

const ADMIN_STATE = "playwright/.auth/admin.json";

test(
  "An approval posts exactly once, whether sent twice at the same time or retried after a lost response",
  { annotation: tr("C60"), tag: "@smoke" },
  async ({ page, request, playwright, baseURL }) => {
    // An own supplier: parallel tests post to the seeded ones and would move its balance.
    const garments = (await po.newSupplier(request, "c60-supplier")).id;
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c60", ratePerKgs: 10 });
    const fiveBales = [po.line(x, 5, { kg: 10, perKg: 10 })]; // 500
    const secondAdmin = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE });

    try {
      await test.step("Two ADMIN sessions approve P1 at the same time: it posts once", async () => {
        const p1 = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: fiveBales });
        const stock = (await po.stockOf(request, x.id)) ?? 0;
        const before = await po.ledger(request, garments);

        const results = await Promise.all([po.approve(request, p1.id), po.approve(secondAdmin, p1.id)]);
        const statuses = results.map((r) => r.status()).sort();
        expect(statuses).toEqual([200, 400]);
        const refused = results.find((r) => r.status() === 400)!;
        expect((await refused.json()).message).toBe("Purchase order already approved");

        expect(await po.stockOf(request, x.id)).toBe(stock + 5);
        const after = await po.ledger(request, garments);
        expect(po.entriesFor(after.rows, p1.id).map((e) => e.amount)).toEqual([500]);
        expect(after.balance).toBeCloseTo(before.balance + 500, 2);
      });

      const p2 = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: fiveBales });
      const stock = (await po.stockOf(request, x.id)) ?? 0;
      const before = await po.ledger(request, garments);
      const row = page.getByRole("row").filter({ hasText: p2.invoiceNumber! });

      await test.step("Approve P2 from the list; the request reaches the server but the response is lost", async () => {
        // Let the approval reach the server, then drop its response, once.
        await page.route(
          `**/api/purchase/approve/${p2.id}`,
          async (route) => {
            await route.fetch();
            await route.abort("connectionreset");
          },
          { times: 1 }
        );
        await page.goto("/purchase");
        const dropped = page.waitForEvent("requestfailed", (r) => r.url().includes(`/api/purchase/approve/${p2.id}`));
        await row.getByRole("img", { name: "check" }).click();
        await page.getByRole("button", { name: "Yes" }).click();
        await dropped;
        // The UI must not claim success it never received: it shows an error or keeps the row PENDING.
        await expect(
          page
            .getByText(/error|failed|network/i)
            .or(row.getByText("PENDING"))
            .first()
        ).toBeVisible();
      });

      await test.step("Reload and approve P2 again: refused as already approved", async () => {
        await page.reload();
        await expect(row.getByText("APPROVED")).toBeVisible();
        await expect(row.getByRole("img", { name: "check" })).toHaveCount(0);
        const retry = await po.approve(request, p2.id);
        expect(retry.status()).toBe(400);
      });

      await test.step("Stock and ledger show P2 posted exactly once", async () => {
        expect(await po.stockOf(request, x.id)).toBe(stock + 5);
        const after = await po.ledger(request, garments);
        expect(po.entriesFor(after.rows, p2.id).map((e) => e.amount)).toEqual([500]);
        expect(after.balance).toBeCloseTo(before.balance + 500, 2);
      });
    } finally {
      await secondAdmin.dispose();
    }
  }
);

// Known risk #220: approval reads the supplier balance outside its transaction, so two approvals at the same
// moment can store overlapping balances. It's a race: run with --repeat-each before trusting a pass.
// Locally this needs the development DB pool from #230; with a pool of 2 parallel approvals deadlock (#228).
test(
  "Approving two purchases for the same supplier and item at the same time keeps both postings",
  { annotation: tr("C62"), tag: "@smoke" },
  async ({ request, playwright, baseURL }) => {
    // An own supplier: parallel tests post to the seeded ones and would move its balance.
    const garments = (await po.newSupplier(request, "c62-supplier")).id;
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c62", ratePerKgs: 10 });
    // X is already in stock (the case records S): give it a stock row first. Two parallel approvals of an item
    // with no stock row yet is a different bug (#231), not this case's lost-update risk.
    const opening = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 1, { kg: 10, perKg: 10 })],
    });
    await po.approveOk(request, opening.id);
    const a = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 5, { kg: 10, perKg: 10 })], // 500
    });
    const b = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 3, { kg: 10, perKg: 10 })], // 300
    });
    const stock = (await po.stockOf(request, x.id)) ?? 0;
    const before = await po.ledger(request, garments);
    const secondAdmin = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE });

    try {
      await test.step("Approve both in parallel: both post, stock and balances add up", async () => {
        const results = await Promise.all([po.approve(request, a.id), po.approve(secondAdmin, b.id)]);
        const outcomes = await Promise.all(results.map(async (r) => `${r.status()} ${(await r.text()).slice(0, 120)}`));
        expect(
          results.map((r) => r.status()),
          outcomes.join(" | ")
        ).toEqual([200, 200]);

        expect(await po.stockOf(request, x.id)).toBe(stock + 8);
        const after = await po.ledger(request, garments);
        const ours = [...po.entriesFor(after.rows, a.id), ...po.entriesFor(after.rows, b.id)].sort(
          (m, n) => m.id - n.id
        );
        expect(ours.map((e) => e.amount).sort()).toEqual([300, 500]);
        expect(after.balance).toBeCloseTo(before.balance + 800, 2);
        // Each new row's stored balance = the balance before it ± its amount, in the order they were posted.
        expect(ours[0].partyBalance).toBeCloseTo(before.balance + ours[0].amount, 2);
        expect(ours[1].partyBalance).toBeCloseTo(ours[0].partyBalance + ours[1].amount, 2);
      });
    } finally {
      await secondAdmin.dispose();
    }
  }
);
