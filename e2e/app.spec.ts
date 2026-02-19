import { test, expect } from '@playwright/test';

test('renders simulator UI and ocean option label', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /RL Fishing Simulator/ })).toBeVisible();
  await expect(page.getByText(/Ocean \(High Reward\)/)).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});
