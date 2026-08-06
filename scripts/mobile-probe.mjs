import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });

// MOBILE /events page
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844 });
await p.goto('http://localhost:4177/events', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1800));
const info = await p.evaluate(() => {
  const nav = document.querySelector('.nav-w, .nav-b');
  const link = document.querySelector('#nav-items a');
  const menuBtn = document.querySelector('#nav-toggle');
  return {
    navCls: nav ? nav.className : null,
    linkColor: link ? getComputedStyle(link).color : null,
    menuBtn: !!menuBtn,
    hamburger: menuBtn ? (menuBtn.getAttribute('aria-expanded')) : null,
  };
});
console.log('MOBILE /events nav:', JSON.stringify(info));

// mobile menu open + white text
await p.click('#nav-toggle').catch(() => {});
await new Promise((r) => setTimeout(r, 400));
const mobileMenu = await p.evaluate(() => {
  const items = document.getElementById('nav-items');
  const link = items ? items.querySelector('a') : null;
  return {
    visible: items ? getComputedStyle(items).display !== 'none' : null,
    linkColor: link ? getComputedStyle(link).color : null,
    menuBg: items ? getComputedStyle(items).backgroundColor : null,
  };
});
console.log('MOBILE /events menu:', JSON.stringify(mobileMenu));

// mobile gallery trigger + modal
await p.evaluate(() => {
  const poster = document.querySelector('div[class*="cursor-pointer"]');
  if (poster) { poster.focus(); poster.click(); }
});
await new Promise((r) => setTimeout(r, 700));
const mmodal = await p.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  return d ? { has: true, focusIn: d.contains(document.activeElement) } : { has: false };
});
console.log('MOBILE modal:', JSON.stringify(mmodal));

// cursor blob: mouse move should update cursor-outline position with clientX
const home = await b.newPage();
await home.setViewport({ width: 1280, height: 800 });
await home.goto('http://localhost:4176/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const cursorInfo = await home.evaluate(() => {
  const el = document.querySelector('.cursor-outline, [class*="cursor-outline"]');
  return el ? { cls: String(el.className).slice(0, 60), pos: el.style.transform || el.style.left + ',' + el.style.top } : null;
});
console.log('cursor-outline el:', JSON.stringify(cursorInfo));
await home.mouse.move(500, 400);
await new Promise((r) => setTimeout(r, 300));
const afterMove = await home.evaluate(() => {
  const el = document.querySelector('.cursor-outline, [class*="cursor-outline"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.x), top: Math.round(r.y) };
});
console.log('after mouse.move(500,400):', JSON.stringify(afterMove));
await home.mouse.move(600, 200);
await new Promise((r) => setTimeout(r, 300));
const afterMove2 = await home.evaluate(() => {
  const el = document.querySelector('.cursor-outline, [class*="cursor-outline"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.x), top: Math.round(r.y) };
});
console.log('after mouse.move(600,200):', JSON.stringify(afterMove2));
// scroll then move: cursor should not drift vertically
await home.evaluate(() => window.scrollTo(0, 800));
await new Promise((r) => setTimeout(r, 300));
await home.mouse.move(500, 400);
await new Promise((r) => setTimeout(r, 300));
const afterScroll = await home.evaluate(() => {
  const el = document.querySelector('.cursor-outline, [class*="cursor-outline"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: Math.round(r.x), top: Math.round(r.y) };
});
console.log('after scrollY=800 + move(500,400):', JSON.stringify(afterScroll));

await b.close();
