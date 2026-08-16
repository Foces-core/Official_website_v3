import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

test.describe('Featuring carousel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await page.locator('#featuring').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  const activeIndex = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.feat-swiper .swiper-slide')].findIndex((s) =>
        s.classList.contains('swiper-slide-active'),
      ),
    );

  test('arrow buttons navigate', async ({ page }) => {
    const before = await activeIndex(page);
    await page.locator('button[aria-label="Next ECHO photos"]').click();
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('keyboard arrows navigate when carousel owns focus', async ({ page }) => {
    // Click the visible slide so it claims arrow ownership (the carousel
    // starts mid-way through duplicated copies; earlier slides are off-screen).
    await page.locator('.feat-swiper .swiper-slide-active').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('pagination dots sit below the images', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const img = document.querySelector('.feat-swiper .swiper-slide img');
      const pag = document.querySelector('.feat-dots');
      return pag.getBoundingClientRect().top >= img.getBoundingClientRect().bottom;
    });
    expect(ok).toBe(true);
  });
});

test.describe('Execom / Meet the team carousel', () => {
  // The Execom carousel runs both a desktop and a mobile variant; the mobile
  // cube is hidden on desktop (CSS), so these interactions are desktop-only.
  test.skip(({ isMobile }) => isMobile, 'team carousel interactions are desktop-only');

  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  const activeIndex = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.execom-swiper .swiper-slide')].findIndex((s) =>
        s.classList.contains('swiper-slide-active'),
      ),
    );

  test('dot indicator navigates the team carousel', async ({ page }) => {
    // Both cube and flat modes render the custom 11-dot indicator (the
    // 3-copy wrap replaces a true loop, so the dots are hand-rolled).
    const before = await activeIndex(page);
    await page.locator('.execom-swiper + div button[aria-label]').nth(2).click();
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('keyboard arrows navigate the team carousel', async ({ page }) => {
    // Click the visible slide so it claims arrow ownership (the swiper starts
    // mid-way through duplicated copies; earlier slides are off-screen).
    await page.locator('.execom-swiper .swiper-slide-active').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('arrow keys still work after clicking a dot (dots are part of the widget)', async ({
    page,
  }) => {
    // The dots sit OUTSIDE the carousel root (direct sibling). If the widget
    // boundary were the root alone, focusing a dot would withhold the arrow
    // keys from the carousel. Click a dot, then verify arrows still advance.
    await page.locator('.execom-swiper + div button[aria-label]').nth(3).click();
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('dots sit below the member cards', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const card = document.querySelector('.execom-swiper .swiper-slide .container-execom');
      const dots = document.querySelector('.execom-swiper + div');
      const pag = document.querySelector('.execom-swiper .swiper-pagination');
      const target = dots || pag;
      if (!card || !target) return false;
      return target.getBoundingClientRect().top >= card.getBoundingClientRect().bottom;
    });
    expect(ok).toBe(true);
  });
});

test.describe('Execom mobile cube drag', () => {
  test.skip(({ isMobile }) => !isMobile, 'cube drag is a touchscreen interaction');

  test('dragging the cube advances to the next member', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    // The cube is only interactive once the hook applied the first transforms
    // — wait for the readiness signal instead of a fixed sleep, so slow/low-
    // power profiles can't flake the test.
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    const activeIndex = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.execom-cube-swiper .swiper-slide')].findIndex((s) =>
          s.classList.contains('swiper-slide-active'),
        ),
      );
    const before = await activeIndex();

    const slide = page.locator('.execom-cube-swiper .swiper-slide-active');
    const box = await slide.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect.poll(activeIndex, { timeout: 5000 }).not.toBe(before);
  });

  test('every member shows on the front face as the cube advances (3-copy overlap is class-gated)', async ({
    page,
  }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    // The 3 copies of 11 slides share the four cube faces (children i, i±4,
    // ... sit at the same angle) — the class-gated visibility CSS decides
    // which child actually shows. Walk every logical member and read the
    // visible (active) member each step to prove the correct one is always
    // front-facing.
    const seen = await page.evaluate(async () => {
      const swiper = document.querySelector('.execom-cube-swiper');
      const inst = swiper.__carousel__;
      inst.autoplay.stop(); // the on-screen autoplay timer must not skip a step mid-walk
      const out = [];
      for (let i = 0; i < 11; i++) {
        const active = swiper.querySelector('.swiper-slide-active img');
        out.push(active ? active.alt : null);
        inst.slideNext();
        await new Promise((r) => setTimeout(r, 250)); // settle the rotation
      }
      return out;
    });
    // All 11 distinct members, in roster order (the wrap repeats content).
    expect(new Set(seen).size).toBe(11);
    expect(seen.every((name) => typeof name === 'string' && name.length > 0)).toBe(true);
  });

  test('rotating the cube never scrolls the page (touch-action none + preventDefault)', async ({
    page,
  }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    // A real phone fires pointer events for a touch drag — the hand-rolled
    // carousel drives its gesture entirely from pointer events, so synthetic
    // PointerEvents are the faithful stand-in. The cube must own the gesture
    // (computed touch-action none) and the hook must engage and preventDefault
    // the horizontal drag — either alone would let a diagonal drag scroll the
    // page mid-rotation.
    const result = await page.evaluate(() => {
      const swiper = document.querySelector('.execom-cube-swiper');
      const slide =
        swiper.querySelector('.swiper-slide-active') || swiper.querySelector('.swiper-slide');
      const rect = slide.getBoundingClientRect();
      const x0 = rect.left + rect.width / 2;
      const y0 = rect.top + rect.height / 2;
      const pointer = (type, x, y) =>
        new PointerEvent(type, {
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
        });

      slide.dispatchEvent(pointer('pointerdown', x0, y0));
      const move = pointer('pointermove', x0 - 80, y0);
      slide.dispatchEvent(move);
      slide.dispatchEvent(pointer('pointerup', x0 - 80, y0));
      return {
        touchAction: getComputedStyle(swiper).touchAction,
        prevented: move.defaultPrevented,
      };
    });

    expect(result.touchAction).toBe('none');
    expect(result.prevented).toBe(true);
  });
});
