import { test, expect } from '@playwright/test';

test.describe('bd-antd-token-previewer E2E', () => {
  test('should load previewer page without errors', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Navigate to the previewer page
    await page.goto('http://localhost:8000/previewer', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();

    // Verify no console errors (ignore React dev mode warnings)
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('Warning:') && !err.includes('ReactDOM.render'),
    );
    expect(criticalErrors).toEqual([]);
  });

  test('should load theme editor page without errors', async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    // Navigate to the editor page
    await page.goto('http://localhost:8000/editor', { timeout: 60000 });
    await page.waitForTimeout(5000);

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();

    // Verify no console errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('Warning:') && !err.includes('ReactDOM.render'),
    );
    expect(criticalErrors).toEqual([]);
  });
});
