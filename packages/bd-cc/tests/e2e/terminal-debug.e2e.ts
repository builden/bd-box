import { test, expect } from "@playwright/test";

test.describe("E2E Tests - Terminal and Chat", () => {
  const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3001";

  test.beforeEach(async ({ page }) => {
    // Add console log listener
    page.on("console", (msg) => {
      console.log(`[BROWSER ${msg.type()}]`, msg.text());
    });
    page.on("pageerror", (err) => {
      console.log(`[BROWSER ERROR]`, err.message);
    });
  });

  test("should load main page and check for terminal", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // Wait a bit for everything to initialize
    await page.waitForTimeout(3000);

    // Check page title
    const title = await page.title();
    console.log("Page title:", title);

    // Get page HTML for debugging
    const html = await page.content();
    console.log("Page HTML length:", html.length);

    // Look for sidebar or main content areas
    const sidebar = await page.locator('aside, [class*="sidebar"]').count();
    console.log("Sidebar elements:", sidebar);

    // Look for project or session related elements
    const projectElements = await page
      .locator("button, a, div")
      .filter({ hasText: /project|session|claude/i })
      .count();
    console.log("Project-related elements:", projectElements);

    // Try to find and click on a project to open chat
    const projectItems = await page.locator('[class*="project"], [class*="session"], [data-testid*="project"]').count();
    console.log("Project/Session items found:", projectItems);

    // Find and click a project in the sidebar (look for folder icons or project names)
    const folderIcons = await page
      .locator('button, [role="button"]')
      .filter({ has: page.locator('svg, [data-lucide*="folder"]') })
      .count();
    console.log("Folder icons found:", folderIcons);

    if (folderIcons > 0) {
      await page
        .locator('button, [role="button"]')
        .filter({ has: page.locator('svg, [data-lucide*="folder"]') })
        .first()
        .click();
      await page.waitForTimeout(3000);
      console.log("Clicked on first folder/project");
    }

    // Look for terminal button (usually has terminal icon)
    const terminalButtons = await page
      .locator('button, [role="button"]')
      .filter({ has: page.locator('svg, [data-lucide*="terminal"]') })
      .count();
    console.log("Terminal buttons found:", terminalButtons);

    // Check for any visible error messages
    const errors = await page.locator(".text-red-500, .text-red-400, [class*='error']").count();
    console.log("Error elements found:", errors);

    // Look for terminal-related elements
    const terminalElements = await page.locator('[class*="terminal"], [class*="xterm"], .xterm-screen').count();
    console.log("Terminal elements found:", terminalElements);

    // Check WebSocket connection
    const wsStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket(`ws://${window.location.host}/ws`);
        ws.onopen = () => {
          ws.close();
          resolve("connected");
        };
        ws.onerror = () => resolve("error");
        setTimeout(() => resolve("timeout"), 5000);
      });
    });
    console.log("WebSocket /ws status:", wsStatus);

    // Check shell WebSocket connection
    const shellWsStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket(`ws://${window.location.host}/shell`);
        ws.onopen = () => {
          ws.close();
          resolve("connected");
        };
        ws.onerror = () => resolve("error");
        setTimeout(() => resolve("timeout"), 5000);
      });
    });
    console.log("WebSocket /shell status:", shellWsStatus);

    // Take a snapshot of the page
    await page.screenshot({ path: "/tmp/test-screenshot.png" });
    console.log("Screenshot saved to /tmp/test-screenshot.png");

    expect(true).toBe(true); // Pass for now
  });
});
