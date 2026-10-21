// spec: specs/purchase-orders.md (2.1 C9)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antSelect } from "../support/antd";
import * as po from "../support/purchase-api";

test.describe("Input integrity", () => {
  test(
    "The create form only submits a complete purchase",
    { annotation: tr("C9"), tag: "@smoke" },
    async ({ page, request }) => {
      // A supplier of this test's own with two BIG_BALES items (parallel tests post to the seeded ones).
      const supplier = await po.newSupplier(request, "c9-supplier");
      const first = await po.createItem(request, supplier.id, "BIG_BALES", { tag: "c9-a" });
      const second = await po.createItem(request, supplier.id, "BIG_BALES", { tag: "c9-b" });
      const countBefore = await po.purchaseCount(request, supplier.id);

      // Setup: a new company with no items.
      const emptyCompany = po.uid("c9-empty");
      const created = await request.post("/api/company", { data: { companyName: emptyCompany } });
      expect(created.status(), await created.text()).toBe(200);

      const createButton = page.getByRole("button", { name: "Create Purchase" });
      const rowOf = (name: string) => page.getByRole("row").filter({ hasText: name });

      // 1. Open /purchase/create with nothing selected
      await test.step("'Create Purchase' is disabled", async () => {
        await page.goto("/purchase/create");
        await expect(page.getByRole("heading", { name: "Create Purchase Order" })).toBeVisible();
        await expect(createButton).toBeDisabled();
      });

      // 2. Select a company only
      await test.step("No items table and still disabled", async () => {
        await antSelect(page, "Company", supplier.name);
        await expect(page.getByRole("button", { name: "Edit All" })).toHaveCount(0);
        await expect(page.getByRole("table")).toHaveCount(0);
        await expect(createButton).toBeDisabled();
      });

      // 3. Select BIG_BALES, select all rows, Remove Selected
      await test.step("The table is empty and 'Create Purchase' is disabled", async () => {
        await antSelect(page, "List Type", "BIG_BALES");
        await expect(rowOf(first.itemName)).toBeVisible();
        await page.getByRole("columnheader").getByRole("checkbox").check();
        await page.getByRole("button", { name: "Remove Selected" }).click();
        await expect(rowOf(first.itemName)).toHaveCount(0);
        await expect(rowOf(second.itemName)).toHaveCount(0);
        await expect(page.getByRole("img", { name: "No data" })).toBeVisible();
        await expect(createButton).toBeDisabled();
      });

      // 4. Select a new company created via the API with no items, and BIG_BALES
      await test.step("No rows and 'Create Purchase' is disabled", async () => {
        await antSelect(page, "Company", emptyCompany);
        await expect(page.getByRole("img", { name: "No data" })).toBeVisible();
        await expect(rowOf(first.itemName)).toHaveCount(0);
        await expect(createButton).toBeDisabled();
      });

      // 5. Select the supplier again and BIG_BALES; fill nothing; Create Purchase
      await test.step("A validation toast is shown and the URL does not change", async () => {
        await antSelect(page, "Company", supplier.name);
        await expect(rowOf(first.itemName)).toBeVisible();
        await expect(createButton).toBeEnabled();
        await createButton.click();
        await expect(page.getByText('ValidationError: "purchasedProducts[0].noOfBales" is required')).toBeVisible();
        await expect(page).toHaveURL(/\/purchase\/create$/);
      });

      // 6. GET /api/purchase
      await test.step("The purchase count is unchanged from before step 1", async () => {
        expect(await po.purchaseCount(request, supplier.id)).toBe(countBefore);
      });
    }
  );
});
