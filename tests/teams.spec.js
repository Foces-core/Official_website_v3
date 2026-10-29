import { test, expect } from '@playwright/test';

test.describe('Execom archive (/teams)', () => {
  test('opens from the execom section button and renders the archive', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#execom').scrollIntoViewIfNeeded();

    await page.getByRole('link', { name: 'Meet All Execom Members' }).click();
    await expect(page).toHaveURL(/\/teams$/);
    await expect(page.locator('.teams-title')).toHaveText('Execom 2024–2025');
    await expect(page.locator('.teams-card').first()).toBeVisible();
    await expect(page.locator('.teams-card')).toHaveCount(12);
  });

  test('search and role filters narrow the member grid', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Search members').fill('sebin');
    await expect(page.locator('.teams-title')).toContainText('Search:');
    await expect(page.locator('.teams-card')).toHaveCount(1);

    await page.getByLabel('Search members').fill('');
    await page.getByRole('button', { name: 'Design', exact: true }).click();
    await expect(page.locator('.teams-card')).toHaveCount(1);
  });

  test('member card opens the lightbox and Escape closes it', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await page.locator('.teams-card').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('carousel view navigates members', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await page.getByLabel('Carousel view').click();
    await expect(page.locator('.teams-caro-slide h2')).toHaveText('Aditya Krishnan');

    await page.getByLabel('Next member').click();
    await expect(page.locator('.teams-caro-slide h2')).toHaveText('Sneha R Menon');
  });
});
