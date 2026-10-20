import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/admin.json";

// Logs in once as the demo org's ADMIN and saves the session; every other test starts signed in.
// Locally and in CI the account comes from `pnpm db:seed-demo-org` with DEMO_ADMIN_PASSWORD set
// (admin@trs.com). Never use real customer or production credentials here.
setup("authenticate as admin", async ({ page }) => {
  const email = process.env.QA_USER_EMAIL;
  const password = process.env.QA_USER_PASSWORD;
  if (!email || !password) {
    throw new Error("Set QA_USER_EMAIL and QA_USER_PASSWORD in .env (local) or as CI secrets.");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Total Sales")).toBeVisible();

  await page.context().storageState({ path: authFile });
});
