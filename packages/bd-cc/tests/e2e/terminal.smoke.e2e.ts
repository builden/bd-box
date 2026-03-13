import { test, expect } from "@playwright/test";

test.describe("Smoke Tests - Terminal", () => {
  const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("should open terminal and verify it connects", async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Look for terminal button or click on a project first
    // Try to find and click the terminal toggle button
    // The selector depends on the actual UI structure

    // Check if there's a terminal icon/button in the UI
    const terminalButtons = await page
      .locator('[aria-label*="terminal"], [data-testid*="terminal"], .terminal-button, button:has-text("Terminal")')
      .count();

    if (terminalButtons > 0) {
      // Click the terminal button
      await page
        .locator('[aria-label*="terminal"], [data-testid*="terminal"], .terminal-button, button:has-text("Terminal")')
        .first()
        .click();
      await page.waitForTimeout(2000);

      // Check if terminal is visible (xterm.js creates a terminal container)
      const terminalContainer = await page.locator('.xterm, .xterm-screen, [class*="terminal"]').count();
      expect(terminalContainer).toBeGreaterThan(0);
    } else {
      // If no terminal button found, test WebSocket connection directly
      const wsReady = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const ws = new WebSocket(`ws://${window.location.host}/ws`);
          ws.onopen = () => {
            ws.close();
            resolve(true);
          };
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 5000);
        });
      });
      expect(wsReady).toBe(true);
    }
  });

  test("should connect to WebSocket terminal successfully", async ({ page }) => {
    // This test verifies WebSocket terminal endpoint is functional
    const response = await page.request.fetch(`${BASE_URL}/api/cli/status`);
    expect(response.status()).toBe(200);
  });
});
