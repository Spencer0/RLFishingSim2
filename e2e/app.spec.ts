import { test, expect } from '@playwright/test';

test('home screen shows key simulation options', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Simple Markov Simulation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Advanced Markov Simulation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Policy Gradient Car' })).toBeVisible();
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


test('can launch policy gradient car simulation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Policy Gradient Car' }).click();
  await expect(page.getByRole('heading', { name: /RL Driving Simulator \(Policy Gradient Car\)/ })).toBeVisible();
  await page.getByRole('tab', { name: /Policy Visualization/ }).click();
  await expect(page.locator('#policyVizPanel').getByText(/Consecutive completions/)).toBeVisible();
});

test('keyboard tab navigation works inside simulation details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Policy Gradient Car' }).click();

  const journalTab = page.getByRole('tab', { name: /Journal/ });
  const brainTab = page.getByRole('tab', { name: /Brain/ });
  const policyTab = page.getByRole('tab', { name: /Policy Visualization/ });

  await journalTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(brainTab).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  await expect(policyTab).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('Home');
  await expect(journalTab).toHaveAttribute('aria-selected', 'true');
});

test('simulation speed slider can be toggled', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Policy Gradient Car' }).click();

  const slider = page.getByRole('slider', { name: /Simulation speed from one to one hundred times/ });
  const speedLabel = page.locator('#simSpeedValue');
  await expect(speedLabel).toHaveText('10x');

  await slider.fill('45');
  await expect(speedLabel).toHaveText('45x');

  await slider.fill('5');
  await expect(speedLabel).toHaveText('5x');
});


test('can deploy policy gradient model and see deployment score modal', async ({ page }) => {
  await page.goto('/?deployLanes=2&deployEpisodes=2&deploySpeed=120');
  await page.getByRole('button', { name: 'Policy Gradient Car' }).click();

  await expect(page.getByRole('button', { name: 'Deploy trained model' })).toBeVisible();
  await page.getByRole('button', { name: 'Deploy trained model' }).click();

  await expect(page.getByRole('heading', { name: /Deploy the model!/ })).toBeVisible();
  await expect(page.locator('#deploymentResultModal')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#deploymentScore')).toContainText(/You scored/);
});
