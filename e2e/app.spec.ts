import { test, expect } from '@playwright/test';

test('home screen shows both simulation options', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Simple Markov Simulation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advanced Markov Simulation' })).toBeVisible();
});

test('can launch simple simulation from home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Simple Markov Simulation' }).click();
  await expect(page.getByRole('heading', { name: /RL Fishing Simulator \(Simple\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});

test('can launch advanced simulation with stock panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Advanced Markov Simulation' }).click();
  await expect(page.getByRole('heading', { name: /RL Fishing Simulator \(Advanced\)/ })).toBeVisible();

  await page.getByRole('tab', { name: /Stock/ }).click();
  await expect(page.getByText(/Use this panel to track each habitat's health/)).toBeVisible();

  await page.getByRole('tab', { name: /Brain/ }).click();
  await expect(page.getByText(/Visited States/)).toBeVisible();
});
