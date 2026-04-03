import { test, expect } from '@playwright/test';

test('floating button should be visible and clickable', async ({ page }) => {
  await page.goto('/example/index.html');

  // Check page title
  await expect(page).toHaveTitle(/Aivis Next/);

  // Check main heading
  await expect(page.getByRole('heading', { name: 'Aivis 功能测试页面' })).toBeVisible();

  // Check floating button exists
  const floatingButton = page.locator('[aria-label="Toggle toolbar"]');
  await expect(floatingButton).toBeVisible();

  // Click the button and verify no errors
  await floatingButton.click();
});

test('floating button drag functionality', async ({ page }) => {
  await page.goto('/example/index.html');

  // Wait for floating button to be visible
  const floatingButton = page.locator('[aria-label="Toggle toolbar"]');
  await expect(floatingButton).toBeVisible();

  // Get initial position
  const initialBox = await floatingButton.boundingBox();
  expect(initialBox).not.toBeNull();

  const initialX = initialBox!.x;
  const initialY = initialBox!.y;

  // Perform drag operation - drag 100px to the left and 50px up
  await floatingButton.dragTo(page.locator('body'), {
    sourcePosition: { x: initialBox!.width / 2, y: initialBox!.height / 2 },
    targetPosition: { x: 200, y: 200 },
  });

  // Give time for the position to update
  await page.waitForTimeout(300);

  // Get new position
  const newBox = await floatingButton.boundingBox();
  expect(newBox).not.toBeNull();

  const newX = newBox!.x;
  const newY = newBox!.y;

  // Verify the button moved significantly
  console.log(`Position changed: (${initialX}, ${initialY}) -> (${newX}, ${newY})`);

  // The button should have moved (at least 50px in some direction)
  const moved = Math.abs(newX - initialX) > 50 || Math.abs(newY - initialY) > 50;
  expect(moved).toBe(true);

  // Reload page
  await page.reload();

  // Verify position persisted after reload
  const reloadBox = await floatingButton.boundingBox();
  expect(reloadBox).not.toBeNull();

  const reloadX = reloadBox!.x;
  const reloadY = reloadBox!.y;

  console.log(`After reload: (${reloadX}, ${reloadY})`);

  // Position should be similar to after drag (within 5px tolerance for rounding)
  expect(Math.abs(reloadX - newX)).toBeLessThanOrEqual(5);
  expect(Math.abs(reloadY - newY)).toBeLessThanOrEqual(5);
});
