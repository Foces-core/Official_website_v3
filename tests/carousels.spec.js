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
        s.hasAttribute('data-slide-active'),
      ),
    );

  test('arrow buttons navigate', async ({ page }) => {
    const before = await activeIndex(page);
    await page.locator('button[aria-label="Next ECHO photos"]').click();
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('keyboard arrows navigate when carousel owns focus', async ({ page }) => {
    await page.locator('.feat-swiper [data-slide-active]').click({ force: true });
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
  test.skip(({ isMobile }) => isMobile, 'team carousel interactions are desktop-only');

  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() =>
      document.getElementById('execom')?.scrollIntoView({ block: 'center' }),
    );
    await page.waitForTimeout(1000);
  });

  test('desktop shows a flat multi-card carousel with navigation arrows', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const carousel = page.locator('.execom-swiper[data-carousel-ready]');
    await expect(carousel).toHaveAttribute('data-carousel-mode', 'flat');
    await expect(page.getByRole('button', { name: 'Next team member' })).toBeVisible();
    const visibleCards = await carousel.locator('.swiper-slide').evaluateAll(
      (slides) =>
        slides.filter((slide) => {
          const rect = slide.getBoundingClientRect();
          const viewport = slide.closest('.execom-swiper').getBoundingClientRect();
          return rect.width > 0 && rect.left >= viewport.left && rect.right <= viewport.right;
        }).length,
    );
    expect(visibleCards).toBeGreaterThan(1);
  });

  test('desktop stays a carousel with motion and low-power overrides', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    for (const override of ['?motion=on', '?motion=off', '?perf=slow']) {
      await page.goto(`/${override}`, { waitUntil: 'domcontentloaded' });
      if (override === '?motion=on') {
        await expect(page.locator('html')).toHaveAttribute('data-motion-reduced', 'false');
      }
      await page.locator('#execom').scrollIntoViewIfNeeded();

      const carousel = page.locator('.execom-swiper[data-carousel-ready]');
      await expect(carousel).toHaveAttribute('data-carousel-mode', 'flat');
      await expect(page.locator('.execom-cube-swiper')).toBeHidden();
    }
  });

  test('uses refreshed portraits on desktop while mobile keeps the existing portrait', async ({
    page,
  }) => {
    const desktopPortrait = page.locator('.execom-swiper img[alt="Lisha Jins"]').first();
    const mobilePortrait = page.locator('.execom-cube-swiper img[alt="Lisha Jins"]').first();

    await expect(desktopPortrait).toHaveAttribute('src', /lisha-2026-[^/]+\.webp$/);
    await expect(mobilePortrait).toHaveAttribute('src', /lisha1-[^/]+\.webp$/);

    for (const name of [
      'Anna Rachel Mathew',
      'Abhirami P',
      'Anjitha Aravind',
      'Lisha Jins',
      'Sebin Mathew',
      'Devadarsana R',
    ]) {
      const portrait = page.locator(`.execom-swiper img[alt="${name}"]`).first();
      await expect(portrait).toHaveCSS('object-position', '50% 50%');
      await expect(portrait).toHaveCSS('filter', /brightness\(0\.92\)/);
    }
  });

  const activeIndex = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.execom-swiper .swiper-slide')].findIndex((s) =>
        s.hasAttribute('data-slide-active'),
      ),
    );

  test('dot indicator navigates the team carousel', async ({ page }) => {
    const before = await activeIndex(page);
    await page.locator('.execom-swiper + div button[aria-label]').nth(2).click();
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('keeps the selected member when switching between desktop and mobile layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.locator('.execom-swiper[data-carousel-ready]').waitFor({ state: 'attached' });
    await page.evaluate(() => {
      document.querySelectorAll('.execom-swiper, .execom-cube-swiper').forEach((el) => {
        el.__carouselEngine__?.stopAutoplay();
      });
    });

    const dot = page.locator('.execom-swiper + div button[aria-label]').nth(3);
    const expectedMember = await dot.getAttribute('aria-label');
    await dot.click();
    await expect(
      page.locator('.execom-swiper [data-slide-active] img:not([aria-hidden="true"])'),
    ).toHaveAttribute('alt', expectedMember.replace('Go to ', ''));

    await page.setViewportSize({ width: 500, height: 850 });
    await expect(
      page.locator('.execom-cube-swiper [data-slide-active] img:not([aria-hidden="true"])'),
    ).toHaveAttribute('alt', expectedMember.replace('Go to ', ''));

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(
      page.locator('.execom-swiper [data-slide-active] img:not([aria-hidden="true"])'),
    ).toHaveAttribute('alt', expectedMember.replace('Go to ', ''));
  });

  test('keyboard arrows navigate the team carousel', async ({ page }) => {
    await page.locator('.execom-swiper [data-slide-active]').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
  });

  test('keyboard slide changes clear image hover color until the pointer re-enters', async ({
    page,
  }) => {
    const centerImage = () =>
      page.locator('.execom-swiper [data-slide-center] img:not([aria-hidden="true"])');
    await centerImage().click({ force: true });
    await centerImage().hover();
    await expect
      .poll(() => centerImage().evaluate((img) => getComputedStyle(img).filter))
      .not.toContain('grayscale(1)');

    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
    await expect
      .poll(() => centerImage().evaluate((img) => getComputedStyle(img).filter))
      .toContain('grayscale');

    await page.mouse.move(5, 5);
    await centerImage().hover();
    await expect
      .poll(() => centerImage().evaluate((img) => getComputedStyle(img).filter))
      .not.toContain('grayscale(1)');
  });

  test('image keeps hover color while the pointer moves into its caption', async ({ page }) => {
    const card = page.locator('.execom-swiper [data-slide-center] .container-execom');
    const image = card.locator('img:not([aria-hidden="true"])');

    await image.hover();
    await expect
      .poll(() => image.evaluate((img) => getComputedStyle(img).filter))
      .not.toContain('grayscale(1)');
    await card.locator(':scope > div.absolute').hover();
    await expect
      .poll(() => image.evaluate((img) => getComputedStyle(img).filter))
      .not.toContain('grayscale(1)');
  });

  test('arrow keys still work after clicking a dot', async ({ page }) => {
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
    await page.evaluate(() =>
      document.getElementById('execom')?.scrollIntoView({ block: 'center' }),
    );
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    const activeIndex = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.execom-cube-swiper .swiper-slide')].findIndex((s) =>
          s.hasAttribute('data-slide-active'),
        ),
      );
    const before = await activeIndex();

    const slide = page.locator('.execom-cube-swiper [data-slide-active]');
    // The section anchor can leave the carousel below the fold — dragging at
    // stale/off-viewport coordinates dispatches no pointer events (autoplay
    // used to mask this; the experience-tier matrix disables autoplay on
    // non-full tiers). Bring the slide into view, then re-measure.
    await page.evaluate(() =>
      document
        .querySelector('.execom-cube-swiper [data-slide-active]')
        ?.scrollIntoView({ block: 'center' }),
    );
    const box = await slide.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect.poll(activeIndex, { timeout: 5000 }).not.toBe(before);
  });

  test('every member shows on the front face as the cube advances', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() =>
      document.getElementById('execom')?.scrollIntoView({ block: 'center' }),
    );
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    const seen = await page.evaluate(() => {
      const swiper = document.querySelector('.execom-cube-swiper');
      const inst = swiper.__carouselEngine__;
      inst.stopAutoplay();
      const out = [];
      for (let i = 0; i < 11; i++) {
        const active = swiper.querySelector('[data-slide-active] img:not([aria-hidden])');
        out.push(active ? active.alt : null);
        inst.slideNext();
      }
      return out;
    });
    expect(new Set(seen).size).toBe(11);
    expect(seen.every((name) => typeof name === 'string' && name.length > 0)).toBe(true);
  });

  test('horizontal drags claim the gesture, vertical swipes scroll the page', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() =>
      document.getElementById('execom')?.scrollIntoView({ block: 'center' }),
    );
    await page.locator('.execom-cube-swiper[data-carousel-ready]').waitFor({
      state: 'attached',
    });

    const result = await page.evaluate(() => {
      const swiper = document.querySelector('.execom-cube-swiper');
      const slide =
        swiper.querySelector('[data-slide-active]') || swiper.querySelector('.swiper-slide');
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
      const horizontal = pointer('pointermove', x0 - 80, y0);
      slide.dispatchEvent(horizontal);
      slide.dispatchEvent(pointer('pointerup', x0 - 80, y0));

      slide.dispatchEvent(pointer('pointerdown', x0, y0));
      const vertical = pointer('pointermove', x0, y0 + 80);
      slide.dispatchEvent(vertical);
      slide.dispatchEvent(pointer('pointerup', x0, y0 + 80));
      return {
        touchAction: getComputedStyle(swiper).touchAction,
        horizontalPrevented: horizontal.defaultPrevented,
        verticalPrevented: vertical.defaultPrevented,
      };
    });

    // Vertical swipes belong to page scroll (touch-action pan-y); only
    // horizontal drags rotate the cube.
    expect(result.touchAction).toBe('pan-y');
    expect(result.horizontalPrevented).toBe(true);
    expect(result.verticalPrevented).toBe(false);
  });
});
