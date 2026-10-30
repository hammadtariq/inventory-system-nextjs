import { test as base, expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { defaultRole, qaRole } from "./roles";

/**
 * Link a test to its case(s). With TestRail, the case id: the JUnit reporter turns it into
 * <property name="test_id" value="C123"/>, which trcli matches with --case-matcher property. Without a tracker
 * (`"tracker": "none"` in .qa/config.json), the row's key in the cases CSV.
 *
 *   test('shows an error for an expired coupon', { annotation: tr('C1234'), tag: '@smoke' }, async ({ page }) => { ... });
 *   test('shows an error for an expired coupon', { annotation: tr('CO-04') }, async ({ page }) => { ... });
 */
// Keep in step with normalizeId in .qa/scripts/lib/specs.mjs, which reads these ids back from the specs.
export function tr(...caseIds: Array<string | number>) {
  const ids = caseIds.map((id) =>
    /^C?\d+$/i.test(String(id)) ? `C${String(id).replace(/^C/i, "")}` : String(id).toUpperCase()
  );
  return { type: "test_id", description: ids.join(",") };
}

// Unique per run (CI run id, else this worker's start time); the worker index and a counter do the rest.
const RUN = process.env.QA_RUN_ID || process.env.GITHUB_RUN_ID || Date.now().toString(36);
let namesMade = 0;

type CreateOptions<T> = {
  as?: string;
  id?: (created: T) => string | number;
  remove?: string | ((created: T) => string) | false;
};

type QaFixtures = {
  /**
   * A page signed in as another role (roles in .qa/config.json), for cases about who may do what:
   *
   *   const staff = await asRole('staff');
   *   await staff.goto('/orders/A-17');
   *   await expect(staff.getByRole('button', { name: 'Refund' })).toHaveCount(0);
   */
  asRole: (role: string) => Promise<Page>;
  /**
   * A request context with a role's session, for "even a direct request is refused":
   *
   *   const res = await (await apiAs('staff')).post('/api/orders/A-17/refunds', { data: { amount: 100 } });
   *   expect(res.status()).toBe(403);
   *
   * It sends the role's cookies. For apps that sign API calls with a token instead, add the header here.
   */
  apiAs: (role: string) => Promise<APIRequestContext>;
  /**
   * Test data that cleans up after itself. Records are created through the app's API and deleted when the
   * test ends, last first, so repeats and parallel workers never see each other's data:
   *
   *   const supplier = await data.create('/api/suppliers', { name: data.name('Supplier') });
   *   // ... the test; supplier is deleted afterwards with DELETE /api/suppliers/<supplier.id>
   *
   * Options: `as` (a role from .qa/config.json; default the default role), `id` (where the id is in the
   * response, default `.id`), `remove` (another collection path to delete from, a function returning the full
   * delete path, or `false` for records the app never deletes, such as ledger entries: give the test its own
   * organisation instead, see the playbook). `data.cleanup(fn)` registers
   * any other undo step. A failed delete doesn't fail the test; it is listed as a "cleanup" annotation.
   */
  data: {
    name: (label: string) => string;
    create: <T = any>(path: string, body: unknown, options?: CreateOptions<T>) => Promise<T>;
    cleanup: (undo: () => Promise<unknown>) => void;
  };
  // Add shared fixtures here, for example an API client:
  // api: ApiClient;
};

export const test = base.extend<QaFixtures>({
  // Inside a test, browser.newContext() already applies the project's `use` (device, locale, time zone),
  // so the role's page matches `page`; only the session differs.
  asRole: async ({ browser, baseURL, contextOptions }, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (role) => {
      const context = await browser.newContext({ ...contextOptions, baseURL, storageState: qaRole(role).authFile });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
  apiAs: async ({ playwright, baseURL }, use) => {
    const contexts: APIRequestContext[] = [];
    await use(async (role) => {
      const context = await playwright.request.newContext({ baseURL, storageState: qaRole(role).authFile });
      contexts.push(context);
      return context;
    });
    await Promise.all(contexts.map((c) => c.dispose()));
  },
  data: async ({ apiAs }, use, testInfo) => {
    const undo: Array<{ what: string; run: () => Promise<unknown> }> = [];
    await use({
      name: (label) => `${label} qa-${RUN}-w${testInfo.workerIndex}-${++namesMade}`,
      create: async (path, body, options = {}) => {
        const api = await apiAs(options.as ?? defaultRole().name);
        const res = await api.post(path, { data: body });
        if (!res.ok())
          throw new Error(`data.create: POST ${path} returned ${res.status()}: ${(await res.text()).slice(0, 200)}`);
        const created = await res.json();
        if (options.remove !== false) {
          let target: string;
          if (typeof options.remove === "function") target = options.remove(created);
          else {
            const id = options.id ? options.id(created) : created?.id;
            // Without an id the undo step would be DELETE <path>/undefined; say so now, not in a cleanup note.
            if (id === undefined || id === null)
              throw new Error(
                `data.create: POST ${path} returned no id; pass { id: (created) => ... }, a remove function or remove: false`
              );
            target = `${options.remove ?? path}/${id}`;
          }
          undo.push({
            what: `DELETE ${target}`,
            run: async () => {
              const del = await api.delete(target);
              // Already gone (the test deleted it) is fine.
              if (!del.ok() && del.status() !== 404) throw new Error(`returned ${del.status()}`);
            },
          });
        }
        return created;
      },
      cleanup: (run) => undo.push({ what: "cleanup step", run }),
    });
    for (const step of undo.reverse()) {
      try {
        await step.run();
      } catch (e) {
        testInfo.annotations.push({ type: "cleanup", description: `${step.what} failed: ${(e as Error).message}` });
      }
    }
  },
  // api: async ({ request }, use) => { await use(new ApiClient(request)); },
});

export { expect };
