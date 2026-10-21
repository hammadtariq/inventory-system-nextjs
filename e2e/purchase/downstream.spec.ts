import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "Correcting a purchase after some bales were sold keeps the sale and applies only the correction",
  { annotation: tr("C41"), tag: "@smoke" },
  async ({ request }) => {
    // An own supplier: parallel tests post to the seeded ones and would move its balance.
    const garments = (await po.newSupplier(request, "c41-supplier")).id;
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c41", ratePerKgs: 10 });
    const p = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 10, { kg: 10, perKg: 10 })], // 1000
    });
    await po.approveOk(request, p.id);
    const customerId = await po.anyCustomerId(request);
    const sale = await po.approvedSale(request, customerId, x, 2);
    const stockAfterSale = (await po.stockOf(request, x.id)) ?? 0;
    const customerBefore = await po.customerLedger(request, customerId);
    const supplierBefore = await po.ledger(request, garments);

    await test.step("Revise the purchase to 7 bales (700) and approve", async () => {
      await po.revise(request, await po.getPurchase(request, p.id), [po.line(x, 7, { kg: 10, perKg: 10 })]);
      await po.approveOk(request, p.id);
      expect((await po.getPurchase(request, p.id)).status).toBe("APPROVED");
    });

    await test.step("Stock drops by the 3 bales corrected, not by the sale again", async () => {
      expect(await po.stockOf(request, x.id)).toBe(stockAfterSale - 3);
    });

    await test.step("The sale and the customer ledger are unchanged", async () => {
      const saleNow = await (await request.get(`/api/sales/${sale.id}`)).json();
      expect(saleNow.status).toBe(sale.status);
      expect(Number(saleNow.totalAmount)).toBe(Number(sale.totalAmount));
      expect(saleNow.soldProducts).toEqual(sale.soldProducts);
      const customerAfter = await po.customerLedger(request, customerId);
      expect(customerAfter.transactions.length).toBe(customerBefore.transactions.length);
      expect(Number(customerAfter.totalBalance)).toBeCloseTo(Number(customerBefore.totalBalance), 2);
    });

    await test.step("The purchase's ledger entry is 700 and the supplier balance falls by 300", async () => {
      const after = await po.ledger(request, garments);
      expect(po.entriesFor(after.rows, p.id).map((e) => e.amount)).toEqual([700]);
      expect(after.balance).toBeCloseTo(supplierBefore.balance - 300, 2);
    });
  }
);
