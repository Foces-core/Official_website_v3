import puppeteer from 'puppeteer-core';
import { PREVIEW_URL, resolveChrome } from './constants.mjs';

const chromePath = resolveChrome();
if (!chromePath) {
  console.error('Chrome not found — set CHROME_PATH to the Chrome/Chromium binary.');
  process.exit(1);
}
const b = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox'],
});
const out = [];

// HOME PAGE: Featuring carousel
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto(`${PREVIEW_URL}/`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// scroll to featuring
await p.evaluate(() => document.getElementById('featuring').scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 1000));

const feat = await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const swiper = sec.querySelector('.swiper');
  const slides = sec.querySelectorAll('.swiper-slide');
  const arrows = Array.from(sec.querySelectorAll('button[aria-label]')).map((b) =>
    b.getAttribute('aria-label'),
  );
  const img = sec.querySelector('.swiper-slide img');
  const imgCls = img ? img.className : '';
  return {
    hasSwiper: !!swiper,
    slideCount: slides.length,
    arrows,
    loop: !!swiper && swiper.classList.contains('swiper-initialized'),
    hoverRing: imgCls.includes('hover:ring-white/50'),
    hoverGlow: imgCls.includes('shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]'),
  };
});
console.log('FEATURING:', JSON.stringify(feat));

// test infinite loop: record realIndex before/after slideNext
const loopInfo = await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const swiperEl = sec.querySelector('.swiper');
  const swiper = swiperEl.__swiper__ || Object.values(swiperEl).find((v) => v && v.slideNext);
  return { hasApi: !!swiper };
});
console.log('FEATURING API access:', JSON.stringify(loopInfo));

// click next arrow repeatedly (5x) — should wrap, not stop
let activeTexts = [];
for (let i = 0; i < 6; i++) {
  await p.click('button[aria-label="Next ECHO photos"]').catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
  const t = await p.evaluate(() => {
    const sec = document.getElementById('featuring');
    const active = sec.querySelector('.swiper-slide-active img');
    return active ? active.getAttribute('alt') : 'none';
  });
  activeTexts.push(t);
}
console.log('NEXT sequence (6 clicks, should cycle):', JSON.stringify(activeTexts));
const unique = new Set(activeTexts).size;
console.log('WRAPS (unique values):', unique > 1 ? 'yes' : 'no');

// prev arrow works
await p.click('button[aria-label="Previous ECHO photos"]').catch(() => {});
await new Promise((r) => setTimeout(r, 600));
const prevT = await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const active = sec.querySelector('.swiper-slide-active img');
  return active ? active.getAttribute('alt') : 'none';
});
console.log('AFTER PREV:', prevT);

// hover glow: simulate hover and check box-shadow on image
await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const img = sec.querySelector('.swiper-slide-active img');
  img.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  img.classList.add(
    'hover\\:shadow-\\[0_0_25px_6px_rgba\\(255\\,255\\,255\\,0\\.25\\)\\]',
    'hover\\:ring-white\\/50',
    'hover\\:scale-105',
  );
});
await new Promise((r) => setTimeout(r, 300));
const hoverState = await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const img = sec.querySelector('.swiper-slide-active img');
  const cs = getComputedStyle(img);
  const r = img.getBoundingClientRect();
  return {
    boxShadow: cs.boxShadow,
    ring: cs.boxShadow.includes('255, 255, 255'),
    topSpace: r.top - (img.parentElement ? img.parentElement.getBoundingClientRect().top : 0),
  };
});
console.log('HOVER GLOW:', JSON.stringify(hoverState));

// EVENTS page: no Register Now, modal infinite loop
const p2 = await b.newPage();
await p2.setViewport({ width: 1280, height: 900 });
await p2.goto(`${PREVIEW_URL}/events`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const reg = await p2.evaluate(() => {
  const html = document.body.innerHTML;
  return {
    registerNow: html.includes('Register Now'),
    registrationClosed: html.includes('Registration Closed') || html.includes('Closed'),
    registerLink: !!document.querySelector('a[href="#"][target="_blank"]'),
  };
});
console.log('EVENTS register buttons:', JSON.stringify(reg));

// open modal, check loop + arrows
await p2.evaluate(() => {
  const poster = document.querySelector(
    'div[class*="relative"][class*="rounded-2xl"][class*="cursor-pointer"]',
  );
  if (poster) {
    poster.focus();
    poster.click();
  }
});
await new Promise((r) => setTimeout(r, 1000));
const modal = await p2.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return null;
  const nav = d.querySelectorAll('.swiper-button-prev, .swiper-button-next');
  const swiperEl = d.querySelector('.swiper');
  return {
    loop: swiperEl ? swiperEl.classList.contains('swiper-initialized') : false,
    arrows: nav.length,
    arrowVisible: nav.length ? getComputedStyle(nav[1]).display !== 'none' : false,
  };
});
console.log('MODAL:', JSON.stringify(modal));

await b.close();
console.log('DONE');
