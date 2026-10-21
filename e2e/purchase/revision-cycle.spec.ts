import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "Editing a revised purchase again while pending keeps the latest values, and re-approval is relative to the last approved version",
  { annotation: tr("C34"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(
      !po.runKnownBugs,
      "Known bug #223 (D1): editing a revised PENDING purchase returns 200 but saves nothing."
    );
    // An own supplier: parallel tests post to the seeded ones and would move its balance.
    const garments = (await po.newSupplier(request, "c34-supplier")).id;
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c34", ratePerKgs: 10 });
    const bales = (n: number) => [po.line(x, n, { kg: 10, perKg: 10 })]; // n × 100
    const stock0 = (await po.stockOf(request, x.id)) ?? 0;
    const b0 = (await po.ledger(request, garments)).balance;
    let p = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: bales(10) });

    await test.step("Approve 10 bales (1000), then revise to 15 (1500)", async () => {
      await po.approveOk(request, p.id);
      p = await po.getPurchase(request, p.id);
      await po.revise(request, p, bales(15));
      p = await po.getPurchase(request, p.id);
      expect(p.status).toBe("PENDING");
      expect(p.revisionNo).toBe(1);
    });

    await test.step("Edit the pending revision to 12 bales (1200); reload and GET", async () => {
      await po.revise(request, p, bales(12));
      p = await po.getPurchase(request, p.id);
      expect(p.purchasedProducts[0].noOfBales).toBe(12);
      expect(Number(p.totalAmount)).toBe(1200);
    });

    await test.step("Approve: stock, the purchase's single entry and the balance follow the 12 bales", async () => {
      await po.approveOk(request, p.id);
      expect(await po.stockOf(request, x.id)).toBe(stock0 + 12);
      const after = await po.ledger(request, garments);
      expect(po.entriesFor(after.rows, p.id).map((e) => e.amount)).toEqual([1200]);
      expect(after.balance).toBeCloseTo(b0 + 1200, 2);
    });

    await test.step("Second cycle: revise to 8 (800), edit to 9 (900), approve", async () => {
      p = await po.getPurchase(request, p.id);
      await po.revise(request, p, bales(8));
      p = await po.getPurchase(request, p.id);
      await po.revise(request, p, bales(9));
      await po.approveOk(request, p.id);
      expect(await po.stockOf(request, x.id)).toBe(stock0 + 9);
      const after = await po.ledger(request, garments);
      expect(po.entriesFor(after.rows, p.id).map((e) => e.amount)).toEqual([900]);
      expect(after.balance).toBeCloseTo(b0 + 900, 2);
    });

    await test.step("The latest revision records -3 bales from the last approved version (12 → 9)", async () => {
      p = await po.getPurchase(request, p.id);
      const change = (p.revisionDetails?.purchasedProducts ?? []).find((l: po.Line) => Number(l.id) === x.id);
      expect(change?.noOfBales).toBe(-3);
    });
  }
);
