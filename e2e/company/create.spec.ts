// spec: specs/companies-crud.md (CO-01 C507, CO-07 C513, CO-15 C521)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antCombobox, antComboboxByPlaceholder, antOptionsMatching } from "../support/antd";
import * as co from "../support/company-api";
import * as po from "../support/purchase-api";

const ROLES: co.Role[] = ["ADMIN", "EDITOR"];

test.describe("Create a supplier", () => {
  test(
    "Staff add a supplier in the form and it is ready to buy from: listed, and offered in the purchase, item and payment company pickers",
    { annotation: tr("C507"), tag: "@smoke" },
    async ({ browser, request }) => {
      test.slow(); // two roles, each through the form, the list and three pickers
      const baseURL = test.info().project.use.baseURL;
      for (const role of ROLES) {
        const page = await co.pageAs(browser, role, baseURL);
        const name = co.supplierName(`Zeta ${role}`);
        const stored = name.toLowerCase();
        try {
          // 1. As the role in the row, open /company and click Create (client navigation)
          await test.step(`${role}: the create form opens with an enabled Create button`, async () => {
            await co.openCreateForm(page);
            await expect(page.getByRole("button", { name: "Create", exact: true })).toBeEnabled();
          });

          // 2. Fill every field and click Create
          await test.step(`${role}: saved and listed first with its details`, async () => {
            await page.getByLabel("Name").fill(name);
            await page.getByLabel("Email").fill("Zeta@Vendor.com");
            await page.getByLabel("Phone").fill("+92 300 1234567");
            await page.getByLabel("Address").fill("Plot 12, Shershah Road, Karachi");
            await page.getByRole("button", { name: "Create", exact: true }).click();
            await expect(page).toHaveURL(/\/company$/);
            // Found by name (not "first row"): parallel tests add suppliers too. companyRow loads the list
            // fresh; SWR would dedupe the request made just before the form (2 s window).
            const row = await co.companyRow(page, stored);
            await expect(row).toContainText(stored);
            await expect(row).toContainText("zeta@vendor.com");
            await expect(row).toContainText("+92 300 1234567");
            await expect(row).toContainText(/plot 12, shershah road, karachi/i);
          });

          // 3. GET /api/company/search?value=<lowercased name>
          await test.step(`${role}: exactly one company with the saved values`, async () => {
            const found = await co.companiesNamed(request, name);
            expect(found).toHaveLength(1);
            expect(found[0]).toMatchObject({
              companyName: stored,
              email: "zeta@vendor.com",
              phone: "+92 300 1234567",
            });
            // The address's case is CO-15 (known bug, owner Q9); compare case-insensitively here.
            expect(found[0].address?.toLowerCase()).toBe("plot 12, shershah road, karachi");
            expect(await co.searchIds(request, stored)).toEqual([found[0].id]);
          });

          // 4. The supplier is offered in the purchase, item and payment company pickers
          await test.step(`${role}: offered in the purchase, item and payment pickers`, async () => {
            await page.goto("/purchase/create");
            await expect(await antOptionsMatching(page, antCombobox(page, "Company"), stored)).toHaveCount(1);
            await page.goto("/items/create");
            await expect(await antOptionsMatching(page, antCombobox(page, "Select Company"), stored)).toHaveCount(1);
            await page.goto("/ledger/create");
            await expect(
              await antOptionsMatching(page, antComboboxByPlaceholder(page, "Select Company"), stored)
            ).toHaveCount(1);
          });
        } finally {
          await page.context().close();
        }
      }
    }
  );

  test(
    "Opening the create or edit page directly (refresh, bookmark, new tab) gives ADMIN and EDITOR a working Create or Update button",
    { annotation: tr("C513") },
    async ({ browser, request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #244: permissions are read at module load, so Create/Update are disabled on a direct page load."
      );
      const baseURL = test.info().project.use.baseURL;
      for (const role of ROLES) {
        const page = await co.pageAs(browser, role, baseURL);
        const s = await co.createSupplier(request, `Direct ${role}`, {
          email: "direct@vendor.com",
          phone: "0300 1111111",
          address: "12 Direct Load Street, Lahore",
        });
        const name = co.supplierName(`Direct New ${role}`);
        try {
          // 1. page.goto('/company/create'), fill a valid new supplier and click Create
          await test.step(`${role}: Create is enabled on a direct load and the supplier is saved`, async () => {
            await page.goto("/company/create");
            await page.getByLabel("Name").fill(name);
            const create = page.getByRole("button", { name: "Create", exact: true });
            await expect(create).toBeEnabled();
            await create.click();
            await expect(page).toHaveURL(/\/company$/);
            expect(await co.companiesNamed(request, name)).toHaveLength(1);
          });

          // 2. page.goto('/company/{S}'), change the Phone and click Update
          await test.step(`${role}: Update is enabled on a direct load and the phone is saved`, async () => {
            await page.goto(`/company/${s.id}`);
            await expect(page.getByLabel("Name")).toHaveValue(s.companyName);
            await page.getByLabel("Phone").fill("0300 2222222");
            const update = page.getByRole("button", { name: "Update" });
            await expect(update).toBeEnabled();
            await update.click();
            await expect(page).toHaveURL(/\/company$/);
            expect((await co.getCompany(request, s.id)).phone).toBe("0300 2222222");
          });

          // 3. Reload /company/{S} and check the Update button
          await test.step(`${role}: Update is still enabled after a reload`, async () => {
            await page.goto(`/company/${s.id}`);
            await page.reload();
            await expect(page.getByLabel("Name")).toHaveValue(s.companyName);
            await expect(page.getByRole("button", { name: "Update" })).toBeEnabled();
          });
        } finally {
          await page.context().close();
        }
      }
    }
  );

  test(
    "The form keeps a supplier's address as typed; only the name and email are saved lowercase",
    { annotation: tr("C521") },
    async ({ page, request }) => {
      test.fixme(
        !po.runKnownBugs,
        "Known bug #252 (owner Q9): the company form lowercases the address with every other value."
      );
      const name = co.supplierName("Address Case");

      // 1. Via the list's Create button, create a supplier with a mixed-case address
      await test.step("The saved address is exactly as typed; name and email are lowercase", async () => {
        await co.openCreateForm(page);
        await page.getByLabel("Name").fill(name);
        await page.getByLabel("Email").fill("Case@Vendor.com");
        await page.getByLabel("Address").fill("Plot 12, Shershah Road, Karachi");
        await page.getByRole("button", { name: "Create", exact: true }).click();
        await expect(page).toHaveURL(/\/company$/);
        const [saved] = await co.companiesNamed(request, name);
        expect(saved).toMatchObject({
          companyName: name.toLowerCase(),
          email: "case@vendor.com",
          address: "Plot 12, Shershah Road, Karachi",
        });
      });

      // 2. Edit it via the list's Edit button and change the address
      await test.step("The edited address is exactly as typed", async () => {
        const row = await co.companyRow(page, name);
        await row.getByRole("button", { name: "Edit" }).click();
        await expect(page.getByLabel("Name")).toHaveValue(name.toLowerCase());
        await page.getByLabel("Address").fill("Unit 4, Mill Road, Faisalabad");
        await page.getByRole("button", { name: "Update" }).click();
        await expect(page).toHaveURL(/\/company$/);
        const [saved] = await co.companiesNamed(request, name);
        expect(saved.address).toBe("Unit 4, Mill Road, Faisalabad");
      });
    }
  );
});
