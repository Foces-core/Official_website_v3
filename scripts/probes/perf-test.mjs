// Multi-profile performance tester.
// Runs Lighthouse against the given URL across device/network/reduced-motion
// profiles and prints scores + the top actionable "what's wrong" items.
//
// Usage:
//   node scripts/probes/perf-test.mjs [url]
//   CHROME_PATH="path/to/chrome|edge|thorium" node scripts/probes/perf-test.mjs https://focess-five.vercel.app/
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_URL } from './constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envChrome = process.env.CHROME_PATH;
const CHROME =
  envChrome && envChrome.toLowerCase().endsWith('.exe')
    ? envChrome
    : 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe';
const URL = process.argv[2] || process.env.URL || PREVIEW_URL;

const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');

const PROFILES = [
  {
    id: 'desktop-fast',
    label: 'Desktop / fast wifi / motion on',
    flags: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-4g',
    label: 'Mobile / 4G throttled / motion on',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-4g-reduced-motion',
    label: 'Mobile / 4G throttled / prefers-reduced-motion',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: true,
  },
  {
    id: 'mobile-3g',
    label: 'Mobile / 3G (simulated) / motion on',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 300,
        throughputKbps: 770,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-2g',
    label: 'Mobile / 2G (simulated) / motion on',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 800,
        throughputKbps: 250,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-cpu6x',
    label: 'Mobile / 4G / 6x CPU slowdown',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638,
        cpuSlowdownMultiplier: 6,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-cpu7x',
    label: 'Mobile / 4G / 7x CPU slowdown',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638,
        cpuSlowdownMultiplier: 7,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
  {
    id: 'mobile-cpu20x',
    label: 'Mobile / 4G / 20x CPU slowdown',
    flags: {
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1638,
        cpuSlowdownMultiplier: 20,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    },
    rmFlag: false,
  },
];

const fmt = (n, d = 1) => (typeof n === 'number' ? n.toFixed(d) : 'n/a');

async function launch(rmFlag) {
  const chromeFlags = ['--headless=new', '--no-sandbox', '--hide-scrollbars'];
  if (rmFlag) chromeFlags.push('--force-prefers-reduced-motion');
  const userDataDir = path.join(os.tmpdir(), `lh-profile-${Date.now()}`);
  await mkdir(userDataDir, { recursive: true });
  return chromeLauncher.launch({
    chromePath: CHROME,
    chromeFlags,
    userDataDir,
  });
}

async function runProfile(profile) {
  const chrome = await launch(profile.rmFlag);
  try {
    const result = await lighthouse(URL, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
      ...profile.flags,
    });
    return result;
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* Chrome may still hold handles on Windows */
    }
  }
}

function summarize(result) {
  const lhr = result.lhr;
  const a = (id) => lhr.audits[id] || {};
  const score = (id) => (lhr.categories[id] ? lhr.categories[id].score : null);
  const core = {
    fcp: a('first-contentful-paint').numericValue,
    lcp: a('largest-contentful-paint').numericValue,
    tbt: a('total-blocking-time').numericValue,
    cls: a('cumulative-layout-shift').numericValue,
    si: a('speed-index').numericValue,
  };
  const opps = Object.values(lhr.audits)
    .filter(
      (x) =>
        x.details &&
        x.details.type === 'opportunity' &&
        typeof x.details.overallSavingsMs === 'number',
    )
    .sort((x, y) => y.details.overallSavingsMs - x.details.overallSavingsMs)
    .slice(0, 6)
    .map((x) => ({ title: x.title, ms: Math.round(x.details.overallSavingsMs) }));
  const transferBytes = Object.values(
    lhr.audits['network-requests'] && lhr.audits['network-requests'].details
      ? lhr.audits['network-requests'].details.items
      : [],
  ).reduce((sum, r) => sum + (r.transferSize || 0), 0);
  return {
    perf: score('performance'),
    a11y: score('accessibility'),
    bp: score('best-practices'),
    fcp: core.fcp,
    lcp: core.lcp,
    tbt: core.tbt,
    cls: core.cls,
    si: core.si,
    transferKB: Math.round(transferBytes / 1024),
    opps,
  };
}

async function main() {
  const rows = [];
  const filter = (process.env.PERF_ONLY || '').split(',').filter(Boolean);
  const profiles = filter.length ? PROFILES.filter((p) => filter.includes(p.id)) : PROFILES;
  for (const p of profiles) {
    const t = Date.now();
    console.log(`\n=== ${p.label} ===`);
    try {
      const r = summarize(await runProfile(p));
      rows.push({ id: p.id, ...r });
      console.log(
        `  Performance ${fmt(r.perf * 100, 0)}/100  A11y ${fmt(r.a11y * 100, 0)}/100  BestPractices ${fmt(r.bp * 100, 0)}/100`,
      );
      console.log(
        `  LCP ${fmt(r.lcp, 0)}ms  TBT ${fmt(r.tbt, 0)}ms  CLS ${fmt(r.cls)}  FCP ${fmt(r.fcp, 0)}ms  SI ${fmt(r.si, 0)}ms`,
      );
      console.log(`  Total transfer ~${r.transferKB}KB`);
      console.log('  Top issues (potential savings):');
      if (r.opps.length) r.opps.forEach((o) => console.log(`   - ${o.title} (~${o.ms}ms)`));
      else console.log('   (none)');
      if (r.cls > 0.1) console.log(`   ! CLS ${r.cls} is above the 0.1 good threshold`);
    } catch (e) {
      console.log('  FAILED:', e.message.split('\n')[0]);
    }
    console.log(`  (took ${((Date.now() - t) / 1000).toFixed(0)}s)`);
  }
  const out = path.join(__dirname, '../.perf-report.json');
  await writeFile(out, JSON.stringify(rows, null, 2));
  console.log(`\nJSON report: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
