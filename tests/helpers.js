import { expect } from '@playwright/test';

// The branded loader is gated off for low-end/reduced-motion; on capable
// machines it fades after fonts+paint (min 2.5s). Make sure it's gone before
// clicking — while it's up, its z-100 overlay swallows every click.
export async function waitForLoaderGone(page) {
  await expect
    .poll(async () => {
      const phase = await page.evaluate(() => {
        // Static inline boot splash — while it's up its fixed inset-0 z-100
        // overlay swallows every click.
        const splash = document.getElementById('boot-splash');
        return splash && !splash.classList.contains('is-fading') ? '1' : 'gone';
      });
      return phase;
    })
    .toBe('gone')
    .catch(() => {});
  await page.waitForTimeout(300);
}

export async function gotoHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForLoaderGone(page);
}
