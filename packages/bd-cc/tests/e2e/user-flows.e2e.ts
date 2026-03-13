import { test, expect } from "@playwright/test";

test.describe("E2E - User Flows", () => {
  const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("should load the main page", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the page title or main content is present
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("should show auth status", async ({ page }) => {
    // Make API call to check auth status
    const response = await page.request.fetch(`${BASE_URL}/api/auth/status`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("needsSetup");
  });

  test("should list projects", async ({ page }) => {
    const response = await page.request.fetch(`${BASE_URL}/api/projects`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    // API returns array directly, not {projects: array}
    expect(Array.isArray(data)).toBe(true);
  });
});
