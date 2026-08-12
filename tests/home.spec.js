import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

test.describe('Home page structure', () => {
  test('all sections render in order', async ({ page }) => {
    await gotoHome(page);
    for (const id of ['home', 'about', 'featuring', 'events', 'execom']) {
      await expect(page.locator(`#${id}`).first()).toBeVisible();
    }
    await expect(page.locator('footer')).toBeVisible();
  });

  test('hero CTA assets load', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero img').first()).toBeVisible();
  });
});

test.describe('Cube easter egg', () => {
  async function scrollToCube(page) {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
  }

  test('rapid arrow spins fire the easter egg toast', async ({ page }) => {
    await scrollToCube(page);
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    await expect(page.locator('.about-toast')).toBeVisible();
  });

  test('no consecutive duplicate toast messages', async ({ page }) => {
    await scrollToCube(page);
    const readToast = async () => {
      const last = page.locator('.about-toast').last();
      await expect(last).toBeVisible();
      return (await last.textContent()).trim();
    };
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    const first = await readToast();
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    const second = await readToast();
    expect(second).not.toBe(first);
  });
});
