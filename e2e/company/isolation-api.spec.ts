// spec: specs/companies-crud.md (CO-13 C519)
// seed: e2e/seed.spec.ts

import { test, expect, tr } from "../fixtures";
import { antCombobox, antOptionsMatching } from "../support/antd";
import * as co from "../support/company-api";
import { asTenant, createOtherOrg } from "../support/second-org";

// Through the API: in production RLS is defence-in-depth only; the app's tenant hooks are the boundary.
test(
  "Another organization's supplier never shows up in list, search or pickers, and can't be read, edited or deleted by id",
  { annotation: tr("C519"), tag: "@smoke" },
  async ({ page, request }) => {
    const other = await createOtherOrg("c519");
    const x = other.companyId;
    const snapshotX = () =>
      asTenant(other.organizationId, async (db) => {
        const res = await db.query(`SELECT "companyName", phone FROM companies WHERE id = $1`, [x]);
        return res.rows[0] as { companyName: string; phone: string | null } | undefined;
      });
    const before = await snapshotX();
    expect(before, "X exists in the other organization").toBeTruthy();
    const xName = before!.companyName;

    // 1. List and search
    await test.step("X is in neither the list nor the search results", async () => {
      const res = await request.get("/api/company", { params: { limit: 5000 } });
      const { rows } = (await res.json()) as { rows: co.Company[] };
      expect.soft(rows.map((c) => c.id)).not.toContain(x);
      expect.soft(rows.every((c) => c.organizationId === rows[0].organizationId)).toBe(true);
      expect.soft(await co.searchIds(request, "qa other supplier")).not.toContain(x);
    });

    // 2. The purchase form's company picker
    await test.step("X isn't offered in the purchase picker", async () => {
      await co.openWithCompanyPicker(page, "/purchase/create");
      await expect(await antOptionsMatching(page, antCombobox(page, "Company"), xName)).toHaveCount(0);
    });

    // 3. GET, PUT and DELETE /api/company/{X}
    await test.step("GET, PUT and DELETE on X's id all return 404", async () => {
      const get = await request.get(`/api/company/${x}`);
      expect.soft(get.status(), "GET").toBe(404);
      expect.soft(await get.text()).toContain("company not exist");
      const put = await request.put(`/api/company/${x}`, { data: { phone: "0300 0000000" } });
      expect.soft(put.status(), "PUT").toBe(404);
      expect.soft(await put.text()).toContain("company not found");
      const del = await request.delete(`/api/company/${x}`);
      expect.soft(del.status(), "DELETE").toBe(404);
      expect.soft(await del.text()).toContain("company does not exist");
    });

    // 4. Move one of this org's suppliers into the other organization
    await test.step("Setting organizationId on an own supplier is refused with 400", async () => {
      const own = await co.createSupplier(request, "Own Org");
      const res = await request.put(`/api/company/${own.id}`, { data: { organizationId: other.organizationId } });
      expect.soft(res.status()).toBe(400);
      expect.soft(await res.text()).toContain('\\"organizationId\\" is not allowed');
      expect.soft((await co.getCompany(request, own.id)).organizationId).not.toBe(other.organizationId);
    });

    // 5. Read X again as the other organization
    await test.step("X is unchanged", async () => {
      expect(await snapshotX()).toEqual(before);
    });
  }
);
