// spec: specs/companies-crud.md (CO-11 C517, CO-12 C518)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";

const NOT_PERMITTED = "Operation not permitted.";

test.describe("Only the owner deletes suppliers", () => {
  test(
    "Staff can't delete a supplier from the screen: the Delete button is disabled for EDITOR",
    { annotation: tr("C517"), tag: "@smoke" },
    async ({ browser, request }) => {
      const s = await co.createSupplier(request, "Staff View");
      const page = await co.pageAs(browser, "EDITOR", test.info().project.use.baseURL);
      try {
        // 1. As EDITOR, open /company and find S
        await test.step("S's Delete button is disabled and its Edit button is enabled", async () => {
          const row = await co.companyRow(page, s.companyName);
          await expect(row.getByRole("button", { name: "Delete" })).toBeDisabled();
          await expect(row.getByRole("button", { name: "Edit" })).toBeEnabled();
        });
      } finally {
        await page.context().close();
      }
    }
  );

  test(
    "The API refuses a staff (EDITOR) request to delete a supplier, and the supplier stays",
    { annotation: tr("C518"), tag: "@smoke" },
    async ({ request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #246: DELETE /api/company/{id} has no role check, so an EDITOR can delete a supplier."
      );
      // No items, so only the role check can stop the delete.
      const s = await co.createSupplier(request, "Staff Delete");
      const ed = await po.loginAs(test.info().project.use.baseURL, po.editor.email, po.editor.password());
      try {
        // 1. As EDITOR, DELETE /api/company/{S}
        await test.step("EDITOR delete is refused with 403 'Operation not permitted.'", async () => {
          const res = await ed.delete(`/api/company/${s.id}`);
          expect.soft(res.status()).toBe(403);
          expect.soft(await res.text()).toContain(NOT_PERMITTED);
        });

        // 2. As ADMIN, GET /api/company/{S}
        await test.step("S still exists, unchanged", async () => {
          expect(await co.getCompany(request, s.id)).toMatchObject({ id: s.id, companyName: s.companyName });
        });
      } finally {
        await ed.dispose();
      }
    }
  );
});
