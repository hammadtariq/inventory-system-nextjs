import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Local runs read .env; CI passes the same names as secrets/variables.
try {
  process.loadEnvFile?.(".env");
} catch {
  /* no .env file */
}

// QA_REPORT_DIR lets CI keep two runs apart (PR: changed tests + smoke).
const reportDir = process.env.QA_REPORT_DIR || "reports";

// No BASE_URL means "test the app from this checkout": Playwright starts it on port 3100.
// CI builds first and runs `next start`; locally it uses the dev server (reused if already running).
// Never point BASE_URL at production.
const localUrl = "http://127.0.0.1:3100";
const baseURL = process.env.BASE_URL || localUrl;

export default defineConfig({
  testDir: "./e2e",
  outputDir: path.join(reportDir, "artifacts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Retry failures at the end, one by one, so a dirty retry can't affect clean tests (Playwright 1.62+).
  retryStrategy: "isolated",
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(reportDir, "html") }],
    // Claude's triage and the digest read this file.
    ["json", { outputFile: path.join(reportDir, "results.json") }],
    // trcli reads this. tr('C123') annotations become <property name="test_id">, matched with --case-matcher property.
    ["junit", { outputFile: path.join(reportDir, "junit.xml"), embedAnnotationsAsProperties: true }],
  ],
  use: {
    baseURL,
    testIdAttribute: "data-testid",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm start -p 3100" : "pnpm dev -p 3100",
        url: `${localUrl}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
});
