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
  args: [
    '--no-sandbox',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-client-side-phishing-detection',
    '--disable-sync',
    '--no-pings',
  ],
});

// MOBILE /events page
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844 });
await p.goto(`${PREVIEW_URL}/events`, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1800));
const info = await p.evaluate(() => {
  const nav = document.querySelector('.nav-w, .nav-b');
  const menuBtn = document.querySelector('#nav-toggle');
  return {
    navCls: nav ? nav.className : null,
    menuBtn: !!menuBtn,
    hamburger: menuBtn ? menuBtn.getAttribute('aria-expanded') : null,
  };
});
console.log('MOBILE /events nav:', JSON.stringify(info));

// mobile menu open + white text (the overlay is portaled with id
// nav-items-mobile — the desktop-only #nav-items never exists on mobile)
await p.click('#nav-toggle').catch(() => {});
await new Promise((r) => setTimeout(r, 400));
const mobileMenu = await p.evaluate(() => {
  const items = document.getElementById('nav-items-mobile');
  const link = items ? items.querySelector('a') : null;
  return {
    visible: items ? getComputedStyle(items).display !== 'none' : null,
    linkColor: link ? getComputedStyle(link).color : null,
    menuBg: items ? getComputedStyle(items).backgroundColor : null,
  };
});
console.log('MOBILE /events menu:', JSON.stringify(mobileMenu));

// close the menu (Escape) so the gallery poster underneath is clickable
await p.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));

// mobile gallery trigger + modal
await p.evaluate(() => {
  const poster = document.querySelector('div[class*="cursor-pointer"]');
  if (poster) {
    poster.focus();
    poster.click();
  }
});
await new Promise((r) => setTimeout(r, 700));
// Target the lightbox root (.yarl__root) — the PWA InstallPrompt also renders
// role=dialog, so a generic dialog query would match the wrong element.
const mmodal = await p.evaluate(() => {
  const d = document.querySelector('.yarl__root');
  return d ? { has: true, focusIn: d.contains(document.activeElement) } : { has: false };
});
console.log('MOBILE modal:', JSON.stringify(mmodal));

// mobile nav links (desktop navbar is hidden; the hamburger must be present)
await p.keyboard.press('Escape'); // close any lightbox if it opened
await new Promise((r) => setTimeout(r, 400));
const links = await p.evaluate(() => {
  const toggle = document.querySelector('#nav-toggle');
  return { toggleVisible: !!toggle && getComputedStyle(toggle).display !== 'none' };
});
console.log('MOBILE hamburger:', JSON.stringify(links));

await b.close();
