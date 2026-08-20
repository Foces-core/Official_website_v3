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
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
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

  test('keyboard arrows navigate the team carousel', async ({ page }) => {
    await page.locator('.execom-swiper [data-slide-active]').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => activeIndex(page), { timeout: 5000 }).not.toBe(before);
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
    await page.locator('#execom').scrollIntoViewIfNeeded();
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
    const box = await slide.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect.poll(activeIndex, { timeout: 5000 }).not.toBe(before);
  });

  test('every member shows on the front face as the cube advances', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
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

  test('rotating the cube never scrolls the page', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
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
