import { expect, test } from '@playwright/test';

/**
 * End-to-end tests against the real static export, driven in headless Chromium.
 * Each test gets an isolated browser context (fresh localStorage).
 */

test.describe('Rakhi Fitness — core flows', () => {
  test('home loads with greeting and all tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Hey Rakhi/i })).toBeVisible();
    for (const tab of ['Home', 'Plan', 'Log', 'Stats', 'Stack', 'Me']) {
      await expect(page.getByRole('link', { name: tab, exact: true })).toBeVisible();
    }
  });

  test('supplement checklist toggles, persists, and updates home count', async ({ page }) => {
    await page.goto('/checklist/');
    await expect(page.getByRole('heading', { name: /Supplements/i })).toBeVisible();

    // Toggle the morning capsule and creatine.
    await page.getByTestId('chk-am-capsule').click();
    await page.getByTestId('chk-creatine').click();
    await expect(page.getByText('2 / 6 done today')).toBeVisible();

    // Persist across reload.
    await page.reload();
    await expect(page.getByText('2 / 6 done today')).toBeVisible();

    // Home reflects the count.
    await page.goto('/');
    await expect(page.getByText('/ 6')).toBeVisible();
  });

  test('log a weight×reps workout (bench press) → appears in history', async ({ page }) => {
    await page.goto('/tracker/');
    // Type like a real user (controlled inputs) into the first set row.
    const kg = page.locator('input[placeholder="kg"]').first();
    await kg.click();
    await kg.pressSequentially('50');
    const reps = page.locator('input[placeholder="reps"]').first();
    await reps.click();
    await reps.pressSequentially('10');
    // Live preview confirms the set registered before committing.
    await expect(page.getByText(/500 kg vol/).first()).toBeVisible();
    await page.getByRole('button', { name: /Commit Log/i }).click();
    await expect(page.getByText(/1 set · 500 kg vol/)).toBeVisible();
  });

  test('log a seconds-based exercise (plank) → history shows time', async ({ page }) => {
    await page.goto('/tracker/');
    await page.selectOption('#exercise', 'plank');
    await page.getByPlaceholder('seconds').first().fill('60');
    await page.getByRole('button', { name: /Commit Log/i }).click();
    await expect(page.getByText(/60s total/)).toBeVisible();
  });

  test('create a custom exercise → selectable in tracker', async ({ page }) => {
    await page.goto('/tracker/add/');
    await page.getByTestId('ex-name').fill('My Cable Fly');
    await page.getByRole('button', { name: /^Reps/ }).click();
    await page.getByTestId('ex-save').click();
    // Redirects back to the tracker (not /tracker/add).
    await page.waitForURL(/\/tracker\/?$/);
    await expect(page.locator('#exercise option', { hasText: 'My Cable Fly' })).toHaveCount(1);
  });

  test('stats page renders both charts and updates bodyweight', async ({ page }) => {
    await page.goto('/progress/');
    await expect(page.getByText('Bodyweight', { exact: true })).toBeVisible();
    await expect(page.getByText('Training Volume')).toBeVisible();
    await expect(page.getByTestId('chart-scroll').first()).toBeVisible();

    await page.getByPlaceholder('Enter new weight (kg)').fill('70');
    await page.getByRole('button', { name: /Update/i }).click();
    await expect(page.getByText('70').first()).toBeVisible();
  });

  test('plan shows today session, calendar, and weekly split', async ({ page }) => {
    await page.goto('/plan/');
    await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
    await expect(page.getByText(/^Today ·/)).toBeVisible();
    await expect(page.getByText('Weekly Split')).toBeVisible();
  });

  test('gym reminder toggle switches on and reveals time picker', async ({ page }) => {
    await page.goto('/account/');
    const toggle = page.getByTestId('reminder-toggle');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('input[type="time"]')).toBeVisible();
  });

  test('bottom-nav navigation works between tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Plan', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Plan', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Stack', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Supplements/i })).toBeVisible();
    await page.getByRole('link', { name: 'Log', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tracker', exact: true })).toBeVisible();
  });
});
