import { test, expect, tr } from "../fixtures";

// Sign-in itself must start signed out, so this file opts out of the saved admin session.
test.use({ storageState: { cookies: [], origins: [] } });

test("admin signs in and sees the dashboard summary", { annotation: tr("C1"), tag: "@smoke" }, async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.getByLabel("Email").fill(process.env.QA_USER_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.QA_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  for (const card of ["Total Sales", "Sale Due", "Total Purchases", "Purchase Due"]) {
    await expect(page.getByText(card, { exact: true })).toBeVisible();
  }
});
