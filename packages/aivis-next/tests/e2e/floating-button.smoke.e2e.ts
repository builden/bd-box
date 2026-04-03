import { test, expect } from '@playwright/test';

test('floating button should be visible and clickable', async ({ page }) => {
  await page.goto('/example/index.html');

  // Check page title
  await expect(page).toHaveTitle(/Aivis Next/);

  // Check main heading
  await expect(page.getByRole('heading', { name: 'Aivis Next Demo' })).toBeVisible();

  // Check floating button exists
  const floatingButton = page.getByRole('button', { name: '+' });
  await expect(floatingButton).toBeVisible();

  // Click the button and verify no errors
  await floatingButton.click();
});
