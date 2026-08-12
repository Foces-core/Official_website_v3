<<<<<<<< HEAD:scripts/probes/carousel-probe.mjs
import puppeteer from 'puppeteer-core';
import { PREVIEW_URL } from './constants.mjs';

const b = await puppeteer.launch({
  executablePath: 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
const out = [];

// HOME PAGE: Featuring carousel
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto(`${PREVIEW_URL}/`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
========
import { test, expect } from '@playwright/test';

// Carousel probe — Featuring/Modal carousel arrows, infinite loop, hover glow, register-button absence checks
>>>>>>>> d959db7 (feat: add back deleted scripts (carousel-probe, create-assets, perf-test)):scripts/carousel-probe.mjs

async function gotoHome(page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#home', { timeout: 10000 });
}

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

<<<<<<<< HEAD:scripts/probes/carousel-probe.mjs
// EVENTS page: no Register Now, modal infinite loop
const p2 = await b.newPage();
await p2.setViewport({ width: 1280, height: 900 });
await p2.goto(`${PREVIEW_URL}/events`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));
========
  test('arrow buttons navigate', async ({ page }) => {
    const before = await activeIndex(page);
    await page.locator('button[aria-label="Next ECHO photos"]').click();
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });
>>>>>>>> d959db7 (feat: add back deleted scripts (carousel-probe, create-assets, perf-test)):scripts/carousel-probe.mjs

  test('keyboard arrows navigate when carousel owns focus', async ({ page }) => {
    await page.locator('.feat-swiper .swiper-slide-active').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
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
    const before = await activeIndex(page);
    await page.locator('.execom-swiper + div button[aria-label]').nth(2).click();
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });

  test('keyboard arrows navigate the team carousel', async ({ page }) => {
    await page.locator('.execom-swiper .swiper-slide-active').click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
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
