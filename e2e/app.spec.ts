import { test, expect } from '@playwright/test';

test('renders simulator, updates journal, and toggles play', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'RL Fishing Simulator' })).toBeVisible();
  await expect(page.getByText(/Time/)).toBeVisible();

  await expect(page.locator('#journal li').first()).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});
