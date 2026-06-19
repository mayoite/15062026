import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ override: false, quiet: true });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "../../tests",
  testMatch: ["**/*.spec.ts", "**/*.spec.tsx"],
  testIgnore: ["**/*.test.ts", "**/*.test.tsx"],
  outputDir: "../../results/test-results",
  fullyParallel: true,

  // DYNAMIC CI FIX: 0 retries locally for fast feedback, 2 retries in CI to prevent flaky pipeline failures.
  retries: isCI ? 2 : 0,

  // DYNAMIC REPORTER: 'list' for terminals, 'html' for CI UI, and ALWAYS 'json' for the Ops Portal telemetry.
  reporter: [
    isCI
      ? ["html", { outputFolder: "../../results/playwright-report" }]
      : ["list"],
    ["json", { outputFile: "../../results/audits/raw-playwright.json" }]
  ],

  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
      // NEXT.JS FIX: Test against the production build to prevent JIT compilation timeouts.
      command: "npm run build && npm run start",
      url: baseURL,
      timeout: 120000,
      // Only reuse the server locally. In CI, we always want a fresh build.
      reuseExistingServer: !isCI,
    },
});
