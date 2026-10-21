import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "A direct request with an inconsistent total does not post an incorrect supplier liability",
  { annotation: tr("C33"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(
      !po.runKnownBugs,
      "Known bug #226: the server saves and posts the client's totalAmount without checking it against the lines."
    );
    const garments = await po.companyId(request, "Ironwood Garments");
    const item = await po.createItem(request, garments, "BIG_BALES", { tag: "c33", ratePerKgs: 100 });
    const lines = [po.line(item, 3, { kg: 50, perKg: 100 })];
    const correct = po.purchaseTotal(lines); // 15000
    expect(correct).toBe(15000);
    const before = await po.ledger(request, garments);
    const count = await po.purchaseCount(request);
    const invoiceNumber = po.uid("c33");

    const res = await request.post("/api/purchase", {
      data: po.purchaseBody({ companyId: garments, baleType: "BIG_BALES", lines, invoiceNumber, totalAmount: 1 }),
    });

    if (res.status() >= 400) {
      await test.step("POST with totalAmount 1: rejected and nothing saved", async () => {
        expect(res.status()).toBeLessThan(500);
        expect(await po.purchaseCount(request)).toBe(count);
      });
      return;
    }

    const p = await po.findByInvoice(request, invoiceNumber);
    await test.step("POST with totalAmount 1: saved with the lines' total", async () => {
      expect(Number(p.totalAmount)).toBe(correct);
    });

    await test.step("Approve: the supplier ledger is debited 15000, never 1", async () => {
      await po.approveOk(request, p.id);
      const after = await po.ledger(request, garments);
      const entries = po.entriesFor(after.rows, p.id);
      expect(entries.map((e) => e.amount)).toEqual([correct]);
      expect(after.balance).toBeCloseTo(before.balance + correct, 2);
    });
  }
);
