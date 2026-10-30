import { test, expect } from '@playwright/test';

test.describe('Execom archive (/teams)', () => {
  test('shows the latest group photo', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.teams-title')).toHaveText('Execom 2025–2026');
    await expect(page.locator('.teams-group-img')).toBeVisible();
  });

  test('year strip switches batches and placeholders show for missing photos', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: '2017-18' }).click();
    await expect(page.locator('.teams-title')).toHaveText('Execom 2017–2018');
    await expect(page.locator('.teams-group-placeholder')).toBeVisible();

    await page.getByRole('button', { name: '2025-26' }).click();
    await expect(page.locator('.teams-title')).toHaveText('Execom 2025–2026');
    await expect(page.locator('.teams-group-img')).toBeVisible();
  });
});
