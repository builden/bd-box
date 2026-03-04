import { defineConfig, devices } from "@playwright/test";
import path from "path";

const e2eDir = path.resolve(__dirname, "tests/e2e");

export default defineConfig({
  testDir: e2eDir,
  testMatch: "**/*.e2e.ts",
  timeout: 90000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  outputDir: path.resolve(__dirname, "tests/test-results"),
  use: {
    trace: "on-first-retry",
    baseURL: `file://${e2eDir}`,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
