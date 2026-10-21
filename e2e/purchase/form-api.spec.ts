import { test, expect, tr } from "../fixtures";
import * as po from "../support/purchase-api";

test(
  "The API refuses an edit that changes a purchase's company or bale type",
  { annotation: tr("C57"), tag: "@smoke" },
  async ({ request }) => {
    test.fixme(!po.runKnownBugs, "Known bug #224 (D5): the API saves a changed company or bale type on edit.");
    const garments = await po.companyId(request, "Ironwood Garments");
    const wholesale = await po.companyId(request, "Ironwood Wholesale");
    const own = await po.seededItem(request, garments, "BIG_BALES", "handbags mixed");
    const theirs = await po.seededItem(request, wholesale, "BIG_BALES", "ladies cotton tops");
    const p = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(own, 2, { kg: 10, perKg: 5 })],
    });

    await test.step("PUT with another company (and its items), then with bale type SMALL_BALES", async () => {
      const otherCompany = await po.editPurchase(request, p.id, {
        companyId: wholesale,
        purchasedProducts: [po.line(theirs, 2, { kg: 10, perKg: 5 })],
        totalAmount: 100,
      });
      expect.soft(otherCompany.status(), "change company").toBeGreaterThanOrEqual(400);
      expect.soft(otherCompany.status(), "change company").toBeLessThan(500);

      const otherType = await po.editPurchase(request, p.id, { baleType: "SMALL_BALES" });
      expect.soft(otherType.status(), "change bale type").toBeGreaterThanOrEqual(400);
      expect.soft(otherType.status(), "change bale type").toBeLessThan(500);
    });

    await test.step("GET: company and bale type unchanged", async () => {
      const saved = await po.getPurchase(request, p.id);
      expect(saved.companyId).toBe(garments);
      expect(saved.baleType).toBe("BIG_BALES");
      expect(saved.purchasedProducts.map((l) => l.id)).toEqual([own.id]);
    });
  }
);
