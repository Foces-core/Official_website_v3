import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

// Regression guard for the ScrollGate boot win: the carousel sections
// (Featuring + Execom) must NOT mount — and their chunk must not be fetched
// as a script — on first load. They must mount when the user scrolls to them.
test.describe('Carousel boot deferral (ScrollGate)', () => {
  test('Featuring + Execom stay unmounted at boot, mount after scrolling', async ({ page }) => {
    await gotoHome(page);

    // Behavioral: no carousel content in the DOM at boot. The ScrollGate
    // wrapper carries the section id, so the section itself is the signal.
    const bootState = await page.evaluate(() => ({
      featuringMounted: !!document.querySelector('#featuring .feat-swiper'),
      execomMounted: !!document.querySelector(
        '#execom .execom-swiper, #execom .execom-cube-swiper',
      ),
      // Script-initiator resources only — the service worker's background
      // precache fetch shows up as initiatorType 'fetch'/'other', so this
      // ignores it and checks only real dynamic-import script loads. The
      // carousel sections ship their own lazy chunks (Featuring/Execom);
      // those must not be fetched at boot.
      carouselScripts: performance
        .getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'script' && /(Featuring|Execom)/.test(r.name)).length,
    }));
    expect(bootState.featuringMounted).toBe(false);
    expect(bootState.execomMounted).toBe(false);
    expect(bootState.carouselScripts).toBe(0);

    // Scroll Featuring into view → the gate opens → chunk loads → carousel mounts.
    await page.locator('#featuring').scrollIntoViewIfNeeded();
    await expect(page.locator('#featuring .feat-swiper')).toBeVisible({ timeout: 10000 });

    // Scroll Execom into view → it mounts too. Both TeamCarousel variants
    // (desktop cube + mobile cube) stay in the DOM with CSS hiding the
    // inactive one, so match the variant that is actually visible.
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await expect(
      page.locator('#execom .execom-swiper:visible, #execom .execom-cube-swiper:visible').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
