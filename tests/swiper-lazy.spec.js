import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

// Regression guard for the ScrollGate boot win: the Swiper sections
// (Featuring + Execom) must NOT mount — and their chunk must not be fetched
// as a script — on first load, or the 312ms swiper-vendor boot eval comes
// back. They must mount when the user scrolls to them.
test.describe('Swiper boot deferral (ScrollGate)', () => {
  test('Featuring + Execom stay unmounted at boot, mount after scrolling', async ({ page }) => {
    await gotoHome(page);

    // Behavioral: no swiper content in the DOM at boot. The ScrollGate
    // wrapper carries the section id, so the section itself is the signal.
    const bootState = await page.evaluate(() => ({
      featuringMounted: !!document.querySelector('#featuring .feat-swiper'),
      execomMounted: !!document.querySelector(
        '#execom .execom-swiper, #execom .execom-cube-swiper',
      ),
      // Script-initiator resources only — the service worker's background
      // precache fetch shows up as initiatorType 'fetch'/'other', so this
      // ignores it and checks only real dynamic-import script loads.
      swiperScripts: performance
        .getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'script' && /swiper/.test(r.name)).length,
    }));
    expect(bootState.featuringMounted).toBe(false);
    expect(bootState.execomMounted).toBe(false);
    expect(bootState.swiperScripts).toBe(0);

    // Scroll Featuring into view → the gate opens → chunk loads → swiper mounts.
    await page.locator('#featuring').scrollIntoViewIfNeeded();
    await expect(page.locator('#featuring .feat-swiper')).toBeVisible({ timeout: 10000 });

    // Scroll Execom into view → it mounts too. Both TeamCarousel variants
    // (desktop swiper + mobile cube) stay in the DOM with CSS hiding the
    // inactive one, so match the variant that is actually visible.
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await expect(
      page.locator('#execom .execom-swiper:visible, #execom .execom-cube-swiper:visible').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
