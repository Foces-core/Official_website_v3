#!/usr/bin/env node
/**
 * Build-time prerender: snapshot each route's fully-rendered DOM into
 * dist/<route>/index.html (ADR-0019).
 *
 * Why: the app mounts via JS, so crawlers saw only the boot splash. This
 * script serves the production build locally, renders every route in
 * headless Chromium, scrolls through the page so the lazy ScrollGate
 * sections mount, and serializes the resulting DOM — real text in the HTML
 * payload for crawlers, same SPA for users.
 *
 * Correctness comes from the runtime itself: the snapshot is whatever React
 * actually rendered (including Seo.jsx's head patches), so static HTML can
 * never drift from the app. seoMeta.js is verified against the captured
 * heads as a tripwire.
 *
 * Fails the build (exit 1) if a route fails to render or its snapshot
 * misses expected content — a silent empty snapshot would be worse than
 * none. Env knobs:
 *   SKIP_PRERENDER=1   opt out (e.g. no Chrome available locally)
 *   PRERENDER_DEBUG=1  keep dist/__prerender/*.json diagnostics on failure
 *
 * Usage: node scripts/prerender.mjs   (expects `vite build` output in dist/)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveChrome } from './probes/constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = 4179; // fixed port for the ephemeral serving window

const ROUTES = ['/', '/events', '/contact'];

// Per-route, content that must appear in the snapshot (case-insensitive
// substring). Chosen from the static data files so a regression (bad lazy
// load, broken route chunk, empty snapshot) fails loudly.
const EXPECTED_CONTENT = {
  '/': ['Forum of Computer Engineering Students', 'Events', 'Execom'],
  '/events': ['FOCES Events', 'The Prompt Paradox 2.0', 'Agentic Coding Workshop'],
  '/contact': ['Contact FOCES', 'College of Engineering Chengannur'],
};

// Route → head assertions derived from the same pure module Seo.jsx uses.
// Loaded dynamically because seoMeta.js lives under src/ (plain ESM, no
// asset imports — safe outside Vite).
const { SITE_ORIGIN, seoRoutes, headTagsForRoute } = await import(
  pathToFileURL(path.join(root, 'src/utils/seoMeta.js'))
);

// ---------------------------------------------------------------------------
// Minimal static server (dist-only, SPA fallback NOT used — the snapshot must
// come from the same URL shape Vercel serves).
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function resolveWithinDist(requestPath) {
  const cleaned = decodeURIComponent(requestPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = path.resolve(dist, cleaned === '' ? 'index.html' : cleaned);
  const real = fs.realpathSync.native(candidate); // throws if missing
  if (real !== dist && !real.startsWith(dist + path.sep)) return null;
  return real;
}

function startServer() {
  const server = http.createServer((req, res) => {
    let filePath;
    try {
      filePath = resolveWithinDist(req.url);
    } catch {
      filePath = null;
    }
    const isFile = filePath && fs.statSync(filePath, { throwIfNoEntry: false })?.isFile();
    if (!isFile) {
      const wantsFallback = !filePath || !path.extname(filePath); // vercel.json mirrors this: /events, /contact → SPA shell
      if (!wantsFallback) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      filePath = path.join(dist, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

// ---------------------------------------------------------------------------
// Snapshotting
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SERVER_ORIGIN = `http://127.0.0.1:${PORT}`;

/**
 * Drop the `<link>` tags the prerender session itself created.
 *
 * Scrolling the page mounts every ScrollGate section, and Vite's preload
 * helper appends a `<link>` per chunk and per lazy stylesheet as it does. Those
 * tags point at this script's throwaway server, so serializing them into the
 * snapshot would do two harmful things:
 *
 *   1. Bake `http://127.0.0.1:4179` into production HTML, so every visitor's
 *      browser tries to fetch that dead origin.
 *   2. Turn the lazy sections into eager boot downloads — the exact deferral
 *      ScrollGate exists for (and that tests/scroll-gate.spec.js asserts).
 *
 * The shell's own tags (entry chunk, vendor runtime, fonts, CSS) are emitted
 * by `vite build` as root-relative paths and are untouched by this. React
 * re-adds whatever it needs at runtime, so nothing is lost for real visitors.
 *
 * @param {string} html - serialized snapshot
 * @returns {string} snapshot without session-injected link tags
 */
function stripSessionLinks(html) {
  const pattern = new RegExp(`<link\\b[^>]*href="${SERVER_ORIGIN}/[^"]*"[^>]*>\\s*`, 'g');
  return html.replace(pattern, '');
}

async function renderRoute(browser, routePath) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${SERVER_ORIGIN}${routePath}`, {
    waitUntil: 'networkidle0',
    timeout: 60_000,
  });

  // The boot splash removes itself once paint is ready; wait it out, then
  // scroll through the page so ScrollGate mounts the lazy sections.
  await page.waitForFunction(() => !document.getElementById('boot-splash'), { timeout: 30_000 });
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  // Let lazy chunks finish mounting + their skeletons resolve.
  await sleep(800);

  const html = stripSessionLinks(await page.content());
  await page.close();
  return html;
}

function checkExpectedContent(routePath, html) {
  const lower = html.toLowerCase();
  const missing = (EXPECTED_CONTENT[routePath] || []).filter(
    (s) => !lower.includes(s.toLowerCase()),
  );
  return missing;
}

// Tripwire for the failure mode stripSessionLinks exists to prevent: a
// throwaway-server origin surviving into the shipped snapshot is always a bug,
// and it is invisible until someone inspects production HTML.
function checkNoServerOrigin(routePath, html) {
  return html.includes(SERVER_ORIGIN)
    ? [`prerender origin leaked into HTML: ${SERVER_ORIGIN}`]
    : [];
}

function checkHead(routePath, html) {
  const route = seoRoutes().find((r) => r.path === routePath);
  if (!route) return [];
  const head = headTagsForRoute(route);
  const problems = [];
  if (!html.includes(`<title>${head.title}</title>`)) {
    problems.push(`title mismatch: expected "${head.title}"`);
  }
  // Compare void-element-normalized: the DOM serializer drops the self-closing
  // slash ("<meta ... />" in source becomes "<meta ...>" in the snapshot), so
  // a raw substring check would never match the runtime-rendered tags.
  const normalized = (tag) => tag.replace(/\s*\/>$/, '>');
  for (const { tag } of head.metaTags) {
    if (!html.includes(normalized(tag))) problems.push(`meta missing/mismatched: ${tag}`);
  }
  const expectedCanonical = routePath === '/' ? SITE_ORIGIN : `${SITE_ORIGIN}${routePath}`;
  if (!html.includes(`<link rel="canonical" href="${expectedCanonical}"`)) {
    problems.push(`canonical missing: ${expectedCanonical}`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (process.env.SKIP_PRERENDER === '1') {
  console.log('prerender: SKIP_PRERENDER=1 — skipping route snapshots.');
  process.exit(0);
}

const chromePath = resolveChrome();
if (!chromePath) {
  // A missing browser must never take the whole deploy down: the SPA shell,
  // the per-route head tags in index.html and the <noscript> summary all still
  // ship, so the site works — it just loses the prerendered route snapshots
  // until a browser is available. Hosts without one (Vercel's build image ships
  // no Chromium) therefore degrade instead of failing.
  //
  // PRERENDER_STRICT=1 restores the fail-fast behavior for CI and local runs
  // that must not silently publish snapshot-less output.
  const strict = process.env.PRERENDER_STRICT === '1';
  const message =
    'prerender: Chrome not found — route snapshots were NOT written. ' +
    'Install a browser (`pnpm exec playwright install chromium`), set CHROME_PATH, ' +
    'or set PRERENDER_STRICT=1 to make this fatal.';
  if (strict) {
    console.error(message);
    process.exit(1);
  }
  console.warn(`[foces] ${message}`);
  process.exit(0);
}
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('prerender: dist/index.html missing — run `vite build` first.');
  process.exit(1);
}

const server = await startServer();
let browser;
const failures = [];
try {
  browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    // Fresh temp profile per run; external requests fail instantly so
    // networkidle0 reflects only local assets (analytics never loads).
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-component-update',
      '--no-pings',
      '--no-first-run',
      '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1',
    ],
  });

  for (const route of ROUTES) {
    const html = await renderRoute(browser, route);
    const missing = checkExpectedContent(route, html);
    const headProblems = [...checkHead(route, html), ...checkNoServerOrigin(route, html)];
    if (missing.length || headProblems.length) {
      failures.push({ route, missing, headProblems });
      if (process.env.PRERENDER_DEBUG === '1') {
        fs.mkdirSync(path.join(dist, '__prerender'), { recursive: true });
        fs.writeFileSync(
          path.join(dist, '__prerender', `${route === '/' ? 'home' : route.slice(1)}.html`),
          html,
        );
      }
      continue;
    }
    const outPath = path.join(dist, route === '/' ? 'index.html' : `${route.slice(1)}/index.html`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(
      `prerender: ${route} -> ${path.relative(root, outPath)} (${(html.length / 1024).toFixed(0)}KB)`,
    );
  }
} catch (err) {
  // Same policy as a missing browser: a broken Chromium (Vercel's image ships
  // none of the shared libraries headless Chrome needs) must not fail the
  // deploy. PRERENDER_STRICT=1 keeps the fail-fast path for CI.
  if (process.env.PRERENDER_STRICT === '1') {
    console.error('prerender failed:', err.message);
    process.exitCode = 1;
  } else {
    console.warn(
      `[foces] prerender could not launch a browser (${err.message}). ` +
        'Route snapshots were NOT written; the SPA shell still ships. ' +
        'Set PRERENDER_STRICT=1 to make this fatal.',
    );
  }
} finally {
  if (browser) await browser.close().catch(() => {});
  server.close();
}

if (failures.length) {
  console.error('prerender: route verification FAILED:');
  for (const f of failures) {
    for (const m of f.missing) console.error(`  ${f.route}: missing content "${m}"`);
    for (const p of f.headProblems) console.error(`  ${f.route}: ${p}`);
  }
  process.exit(1);
}
console.log('prerender: all routes verified and written.');
