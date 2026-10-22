// spec: specs/companies-crud.md (CO-14 C520)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";

test(
  "Finding a supplier by name ignores letter case, wherever staff search for it",
  { annotation: tr("C520") },
  async ({ page, request }) => {
    test.fixme(
      !po.runKnownBugs,
      "Known bug #250 (owner Q6): /api/company/search uses a case-sensitive LIKE, and the items list lowercases what staff type."
    );
    const s = await co.createSupplier(request, "Coastal Search");
    const item = await po.createItem(request, s.id, "BIG_BALES", { tag: "c520", ratePerKgs: 10 });

    // 1. GET /api/company/search with the name in each case
    for (const value of [s.companyName, s.companyName.toLowerCase(), s.companyName.toUpperCase()]) {
      await test.step(`Search "${value}" returns the supplier`, async () => {
        expect.soft(await co.searchIds(request, value)).toContain(s.id);
      });
    }

    // 2. On /items, search by company in lower case
    await test.step("The items list finds the supplier by its lower-case name and lists its item", async () => {
      await page.goto("/items");
      const search = page.getByPlaceholder("search company");
      await search.fill(s.companyName.toLowerCase());
      await page.getByText(s.companyName, { exact: true }).filter({ visible: true }).click();
      await expect(page.getByRole("row").filter({ hasText: item.itemName })).toBeVisible();
    });
  }
);
