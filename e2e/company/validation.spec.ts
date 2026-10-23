// spec: specs/companies-crud.md (CO-02 C508)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import * as co from "../support/company-api";

type Row = {
  field: "Name" | "Email" | "Phone" | "Address";
  key: "companyName" | "email" | "phone" | "address";
  value: string;
  formMessage: string;
  apiMessage: string;
};

// The case's data table (specs/cases/companies-crud.csv, CO-02).
const ROWS: Row[] = [
  {
    field: "Name",
    key: "companyName",
    value: "",
    formMessage: "Name is required!",
    apiMessage: '"companyName" is required',
  },
  {
    field: "Name",
    key: "companyName",
    value: "ab",
    formMessage: "'companyName' must be at least 3 characters",
    apiMessage: '"companyName" length must be at least 3 characters long',
  },
  {
    field: "Email",
    key: "email",
    value: "not-an-email",
    formMessage: "Email is not a valid email!",
    apiMessage: '"email" must be a valid email',
  },
  {
    field: "Phone",
    key: "phone",
    value: "1234567890123456789012345",
    formMessage: "'phone' cannot be longer than 24 characters",
    apiMessage: '"phone" length must be less than or equal to 24 characters long',
  },
  {
    field: "Address",
    key: "address",
    value: "short",
    formMessage: "'address' must be at least 10 characters",
    apiMessage: '"address" length must be at least 10 characters long',
  },
];

test(
  "A supplier with a missing or short name, a malformed email, an over-long phone or a short address is refused in the form and at the API, and nothing is saved",
  { annotation: tr("C508") },
  async ({ page, request }) => {
    // "Nothing is saved" is checked by name: other workers create companies in parallel, so a total
    // company count would move. Each row's otherwise-valid company has its own unique name.
    const valid = (row: Row) => ({
      companyName: co.supplierName(`Invalid ${row.field}`),
      email: "valid@vendor.com",
      phone: "0300 1234567",
      address: "12 Valid Street, Karachi",
    });

    // The name rows can't be found by a unique name; "ab" is the only one that could be stored.
    const abBefore = (await co.companiesNamed(request, "ab")).map((c) => c.id);

    for (const row of ROWS) {
      const label = `${row.field} = "${row.value}"`;

      // 1. Open the create form, enter the row's value with an otherwise valid company and leave the field
      await test.step(`Form refuses ${label}: "${row.formMessage}", nothing saved`, async () => {
        const data = valid(row);
        await co.openCreateForm(page);
        await page.getByLabel("Name").fill(data.companyName);
        await page.getByLabel("Email").fill(data.email);
        await page.getByLabel("Phone").fill(data.phone);
        await page.getByLabel("Address").fill(data.address);
        await page.getByLabel(row.field).fill(row.value);
        await page.getByLabel(row.field).blur();
        await expect.soft(page.getByText(row.formMessage, { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Create", exact: true }).click();
        await expect.soft(page).toHaveURL(/\/company\/create$/);
        if (row.key !== "companyName") expect.soft(await co.companiesNamed(request, data.companyName)).toEqual([]);
      });

      // 2. POST /api/company with the same value
      await test.step(`API refuses ${label}: 400 "${row.apiMessage}", nothing saved`, async () => {
        const data: Record<string, string> = { ...valid(row), [row.key]: row.value };
        if (row.key === "companyName" && row.value === "") delete data.companyName;
        const res = await request.post("/api/company", { data });
        expect.soft(res.status()).toBe(400);
        expect.soft(((await res.json()) as { message: string }).message).toContain(row.apiMessage);
        if (row.key !== "companyName") expect.soft(await co.companiesNamed(request, data.companyName)).toEqual([]);
      });
    }

    // 3. GET /api/company
    await test.step("No company was saved by the refused name rows", async () => {
      expect((await co.companiesNamed(request, "ab")).map((c) => c.id)).toEqual(abBefore);
    });
  }
);
