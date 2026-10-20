import { test, expect } from "./fixtures";

// Seed for the Playwright planner and generator agents: it opens the app signed in as the
// demo ADMIN (storage state from auth.setup.ts) so the agents start where real tests start.
test("seed", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Total Sales")).toBeVisible();
});
