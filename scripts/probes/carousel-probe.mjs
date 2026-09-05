import puppeteer from 'puppeteer-core';
import { PREVIEW_URL, QUIET_CHROMIUM_ARGS, resolveChrome } from './constants.mjs';

const chromePath = resolveChrome();
if (!chromePath) {
  console.error('Chrome not found — set CHROME_PATH to the Chrome/Chromium binary.');
  process.exit(1);
}
const b = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: [...QUIET_CHROMIUM_ARGS],
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
  const carousel = sec.querySelector('.feat-swiper');
  const slides = sec.querySelectorAll('.swiper-slide');
  const arrows = Array.from(sec.querySelectorAll('button[aria-label]')).map((b) =>
    b.getAttribute('aria-label'),
  );
  const img = sec.querySelector('.swiper-slide img');
  const imgCls = img ? img.className : '';
  return {
    hasCarousel: !!carousel,
    mode: carousel ? carousel.getAttribute('data-carousel-mode') : null,
    slideCount: slides.length,
    arrows,
    hoverRing: imgCls.includes('hover:ring-white/50'),
    hoverGlow: imgCls.includes('shadow-[0_0_25px_6px_rgba(255,255,255,0.25)]'),
  };
});
console.log('FEATURING:', JSON.stringify(feat));

// test infinite loop: record active index before/after slideNext
const loopInfo = await p.evaluate(() => {
  const sec = document.getElementById('featuring');
  const carouselEl = sec.querySelector('.feat-swiper');
  // The carousel root may not have mounted yet (lazy chunk) — keep the
  // diagnostic result instead of dereferencing null and aborting the probe.
  const carousel = carouselEl?.__carouselEngine__;
  return { hasApi: !!carousel && typeof carousel.slideNext === 'function' };
});
console.log('FEATURING API access:', JSON.stringify(loopInfo));

// click next arrow repeatedly (5x) — should wrap, not stop
let activeTexts = [];
for (let i = 0; i < 6; i++) {
  await p.click('button[aria-label="Next ECHO photos"]').catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
  const t = await p.evaluate(() => {
    const sec = document.getElementById('featuring');
    const active = sec.querySelector('[data-slide-active] img');
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
  const active = sec.querySelector('[data-slide-active] img');
  return active ? active.getAttribute('alt') : 'none';
});
console.log('AFTER PREV:', prevT);

// hover glow: real pointer hover triggers Tailwind's hover: classes on the
// active slide's image (mouseover events + manual class-add would not).
const hoverBox = await p.$eval('[data-slide-active] img', (img) => {
  const r = img.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(hoverBox.x, hoverBox.y);
await new Promise((r) => setTimeout(r, 300));
const hoverState = await p.$eval('[data-slide-active] img', (img) => {
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

// open modal, check it renders slides + counter (the lightbox is
// yet-another-react-lightbox, not a swiper — just confirm it opens)
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
  const imgs = d.querySelectorAll('img').length;
  const counter = d.querySelector('.yarl\\.\\.counter, [class*="counter"]');
  return {
    open: true,
    imgs,
    hasCounter: !!counter,
  };
});
console.log('MODAL:', JSON.stringify(modal));

await b.close();
console.log('DONE');
