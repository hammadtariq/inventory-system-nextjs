import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

const I = po.FORM_INPUT;
const DAY = 24 * 60 * 60 * 1000;

test(
  "New purchases default to the latest cost, a typed rate is kept, and older purchases keep their recorded rates",
  { annotation: tr("C46"), tag: "@smoke" },
  async ({ page, request }) => {
    const garments = await po.companyId(request, "Ironwood Garments");
    const x = await po.createItem(request, garments, "BIG_BALES", { tag: "c46", ratePerKgs: 10 });
    const a = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 2, { kg: 20, perKg: 10 })], // 400
      purchaseDate: new Date(Date.now() - 2 * DAY),
    });
    await po.approveOk(request, a.id);
    const b = await po.createPurchase(request, {
      companyId: garments,
      baleType: "BIG_BALES",
      lines: [po.line(x, 2, { kg: 10, perKg: 14 })], // 280
    });
    await po.approveOk(request, b.id);
    const rowX = page.getByRole("row").filter({ hasText: x.itemName });

    await test.step("A new purchase defaults X to the latest cost, Rs 14/kg", async () => {
      await page.goto("/purchase/create");
      await antSelect(page, "Company", "Ironwood Garments");
      await antSelect(page, "List Type", "BIG_BALES");
      await expect(rowX).toBeVisible();
      if (po.knownBug("#232", "the form defaults to the item's original rate, not the latest purchase cost")) {
        // Defaults appear in the editable inputs (the read-only rows show no rates).
        await page.getByRole("button", { name: "Edit All" }).click();
        await expect.soft(rowX.getByRole("spinbutton").nth(I.ratePerKgs)).toHaveValue("14");
      }
    });

    await test.step("The older purchase A keeps Rs 10/kg, its total and its ledger amount", async () => {
      const savedA = await po.getPurchase(request, a.id);
      expect(Number(savedA.purchasedProducts[0].ratePerKgs)).toBe(10);
      expect(Number(savedA.totalAmount)).toBe(400);
      const ledger = await po.ledger(request, garments);
      expect(po.entriesFor(ledger.rows, a.id).map((e) => e.amount)).toEqual([400]);
      await page.goto(`/purchase/${a.id}?type=view`);
      await expect(rowX.getByRole("cell", { name: "10", exact: true })).toBeVisible();
    });

    await test.step("A typed rate of Rs 13/kg is saved and shown again on the edit page", async () => {
      const invoice = po.uid("c46-inv");
      await page.goto("/purchase/create");
      await antSelect(page, "Company", "Ironwood Garments");
      await antSelect(page, "List Type", "BIG_BALES");
      await page.getByRole("button", { name: "Edit All" }).click();
      const inputs = rowX.getByRole("spinbutton");
      await inputs.nth(I.bales).fill("2");
      await inputs.nth(I.kgs).fill("10");
      await inputs.nth(I.ratePerKgs).fill("13");
      await page.getByRole("button", { name: "Save All" }).click();
      await page.getByLabel("Invoice No").fill(invoice);
      await page.getByRole("button", { name: "Create Purchase" }).click();
      await expect(page).toHaveURL(/\/purchase$/);

      const saved = await po.findByInvoice(request, invoice);
      expect(Number(saved.purchasedProducts[0].ratePerKgs)).toBe(13);
      await page.goto(`/purchase/${saved.id}`);
      await page.getByRole("button", { name: "Edit All" }).click();
      await expect(rowX.getByRole("spinbutton").nth(I.ratePerKgs)).toHaveValue("13");
    });
  }
);
