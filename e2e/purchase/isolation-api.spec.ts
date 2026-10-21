import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";
import { createOtherOrg, otherOrgSnapshot, stockRowsFor } from "../support/second-org";

// Fields of a purchase that a refused request must leave untouched.
const snapshot = (p: po.Purchase) => ({
  companyId: p.companyId,
  baleType: p.baleType,
  status: p.status,
  totalAmount: Number(p.totalAmount),
  purchasedProducts: p.purchasedProducts,
});

test(
  "Another organization's purchases, companies and items can't be seen or touched",
  { annotation: tr("C58"), tag: "@smoke" },
  async ({ request }) => {
    const other = await createOtherOrg("c58");
    const otherBefore = await otherOrgSnapshot(other);
    // An own supplier: parallel tests post to the seeded ones and would move its purchase count.
    const garments = (await po.newSupplier(request, "c58-supplier")).id;
    const own = await po.createItem(request, garments, "BIG_BALES", { tag: "c58", ratePerKgs: 5 });
    const ownLine = po.line(own, 2, { kg: 10, perKg: 5 });

    let demoOrgId = 0;
    await test.step("A new purchase and every listed purchase belong to the signed-in organization", async () => {
      const p = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: [ownLine] });
      demoOrgId = (p as any).organizationId;
      expect(demoOrgId).toBeTruthy();
      expect(demoOrgId).not.toBe(other.organizationId);
      expect(((await po.getPurchase(request, p.id)) as any).organizationId).toBe(demoOrgId);
      const orgIds = new Set((await po.listPurchases(request)).rows.map((r: any) => r.organizationId));
      expect([...orgIds]).toEqual([demoOrgId]);
    });

    await test.step("The other org's purchase Z is not listed, and GET, PUT, approve and cancel return 404", async () => {
      const ids = (await po.listPurchases(request)).rows.map((r) => r.id);
      expect(ids).not.toContain(other.purchaseId);
      const z = other.purchaseId;
      expect.soft((await request.get(`/api/purchase/${z}`)).status(), "GET Z").toBe(404);
      expect.soft((await po.editPurchase(request, z, { surCharge: 1, totalAmount: 401 })).status(), "PUT Z").toBe(404);
      expect.soft((await po.approve(request, z)).status(), "approve Z").toBe(404);
      expect.soft((await po.cancel(request, z)).status(), "cancel Z").toBe(404);
    });

    await test.step("Creating a purchase with the other org's company or item is refused and saves nothing", async () => {
      const count = await po.purchaseCount(request, garments);
      const invoices = [po.uid("c58-their-company"), po.uid("c58-their-item")];
      const withTheirCompany = await request.post("/api/purchase", {
        data: po.purchaseBody({
          companyId: other.companyId,
          baleType: "BIG_BALES",
          lines: [ownLine],
          invoiceNumber: invoices[0],
        }),
      });
      expect.soft(withTheirCompany.status(), "their company").toBe(404);
      const withTheirItem = await request.post("/api/purchase", {
        data: po.purchaseBody({
          companyId: garments,
          baleType: "BIG_BALES",
          lines: [{ id: other.itemId, itemName: other.itemName, noOfBales: 2, baleWeightKgs: 10, ratePerKgs: 5 }],
          invoiceNumber: invoices[1],
        }),
      });
      expect.soft(withTheirItem.status(), "their item").toBe(404);
      expect(await po.purchaseCount(request, garments)).toBe(count);
      for (const invoice of invoices) expect(await po.withInvoice(request, invoice), invoice).toEqual([]);
    });

    await test.step("As the other org: Z, its stock and its ledger are unchanged", async () => {
      expect(await otherOrgSnapshot(other)).toEqual(otherBefore);
    });
  }
);

test(
  "An edit can only attach this supplier's items of this bale type, never another organization's or a nonexistent one",
  { annotation: tr("C59"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(!po.runKnownBugs, "Known bug #218 (D8b): PUT /api/purchase/{id} never checks the items it saves.");
    const other = await createOtherOrg("c59");
    const otherBefore = await otherOrgSnapshot(other);
    // Own suppliers: parallel tests post to the seeded ones and would move their purchase counts.
    const garments = (await po.newSupplier(request, "c59-supplier")).id;
    const wholesale = (await po.newSupplier(request, "c59-other")).id;
    const own = await po.createItem(request, garments, "BIG_BALES", { tag: "c59-own", ratePerKgs: 5 });
    const otherCompanyItem = await po.createItem(request, wholesale, "BIG_BALES", { tag: "c59-other", ratePerKgs: 5 });
    const smallItem = await po.createItem(request, garments, "SMALL_BALES", { tag: "c59", ratePerBale: 10 });
    const ownLine = po.line(own, 2, { kg: 10, perKg: 5 });
    const p = await po.createPurchase(request, { companyId: garments, baleType: "BIG_BALES", lines: [ownLine] });

    const edits: { name: string; extra: po.Line; status: number | "4xx" }[] = [
      {
        name: "item doesn't exist",
        extra: { id: 999999, itemName: "no such item", noOfBales: 1, ratePerKgs: 5, baleWeightKgs: 10 },
        status: 404,
      },
      { name: "item of another company", extra: po.line(otherCompanyItem, 1, { kg: 10, perKg: 5 }), status: 404 },
      { name: "item of the other bale type", extra: po.line(smallItem, 1, { perBale: 10 }), status: "4xx" },
      {
        name: "another organization's item",
        extra: { id: other.itemId, itemName: other.itemName, noOfBales: 1, baleWeightKgs: 10, ratePerKgs: 5 },
        status: 404,
      },
    ];

    for (const row of edits) {
      await test.step(`PUT with ${row.name}: refused, P unchanged`, async () => {
        const before = snapshot(await po.getPurchase(request, p.id));
        const lines = [ownLine, row.extra];
        const res = await po.editPurchase(request, p.id, {
          purchasedProducts: lines,
          totalAmount: po.purchaseTotal(lines),
        });
        if (row.status === "4xx") {
          expect.soft(res.status(), row.name).toBeGreaterThanOrEqual(400);
          expect.soft(res.status(), row.name).toBeLessThan(500);
        } else {
          expect.soft(res.status(), row.name).toBe(row.status);
        }
        expect.soft(snapshot(await po.getPurchase(request, p.id)), `${row.name}: P unchanged`).toEqual(before);
      });
    }

    await test.step("POST a BIG_BALES purchase with a SMALL_BALES item: refused, nothing saved", async () => {
      const count = await po.purchaseCount(request, garments);
      const invoiceNumber = po.uid("c59-small");
      const res = await request.post("/api/purchase", {
        data: po.purchaseBody({
          companyId: garments,
          baleType: "BIG_BALES",
          lines: [po.line(smallItem, 1, { perBale: 10 })],
          invoiceNumber,
        }),
      });
      expect.soft(res.status()).toBeGreaterThanOrEqual(400);
      expect.soft(res.status()).toBeLessThan(500);
      expect(await po.purchaseCount(request, garments)).toBe(count);
      expect(await po.withInvoice(request, invoiceNumber)).toEqual([]);
    });

    await test.step("The other org's data is untouched and this org has no stock row keyed by its item", async () => {
      expect(await otherOrgSnapshot(other)).toEqual(otherBefore);
      expect(await stockRowsFor((p as any).organizationId, other.itemId)).toEqual([]);
    });
  }
);
