import { test as base, expect } from "@playwright/test";

/**
 * Link a test to its TestRail case(s). The JUnit reporter turns this into
 * <property name="test_id" value="C123"/>, which trcli matches with --case-matcher property.
 *
 *   test('shows an error for an expired coupon', { annotation: tr('C1234'), tag: '@smoke' }, async ({ page }) => { ... });
 */
export function tr(...caseIds: Array<string | number>) {
  const ids = caseIds.map((id) => `C${String(id).replace(/^C/i, "")}`);
  return { type: "test_id", description: ids.join(",") };
}

type QaFixtures = {
  // Add shared fixtures here, for example an API client that seeds data:
  // api: ApiClient;
};

export const test = base.extend<QaFixtures>({
  // api: async ({ request }, use) => { await use(new ApiClient(request)); },
});

export { expect };
