/* global process */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FONT_JOBS, FONT_OUT_DIR, LATIN_TEXT } from '../../scripts/fonts/subset-fonts.mjs';

// Build-time font subsetting (scripts/fonts/subset-fonts.mjs + the vite
// plugin) pins each variable font's wght axis to the weights the site uses.
// This guard is the mirror of tests/unit/aosCss.spec.js: if a new font weight
// is added to src/ it must fall inside the pinned range of the family it is
// used on (or the range must be extended in the same change) — otherwise the
// weight is synthesized or falls back and the subset is silently wrong.

// On Windows/vitest, import.meta.url is not a file:// URL — tests run from
// the project root, so process.cwd() is the reliable anchor.
const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

// Tailwind weight utilities → numeric weight. font-Grotesk (a font-FAMILY
// utility) is intentionally not in this map.
const CLASS_WEIGHTS = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Map a font-family value to a FONT_JOBS family key ('inter' | 'grotesk').
// Any family other than Space Grotesk (or none declared) is Inter — the site
// only uses these two variable fonts.
function familyKey(familyText) {
  return /Grotesk/.test(familyText) ? 'grotesk' : 'inter';
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      // foces-webv23 is OFF-LIMITS (archived Sanity studio) — never scan it.
      if (entry.name !== 'foces-webv23') out.push(...walk(p));
    } else if (/\.(jsx?|css)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// Per-family weights actually used in src/. Each weight is attributed to the
// family it renders with: for CSS, the font-family declared in the same rule
// block; for JSX, the className string containing the weight class. A family
// that renders any explicit weight also gets its browser default (400).
function collectWeights() {
  const used = { inter: new Set(), grotesk: new Set() };
  const add = (family, weight) => used[family].add(weight);
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    if (/\.css$/.test(file)) {
      // Per rule block: co-located font-family + font-weight declarations.
      for (const block of text.matchAll(/\{[^{}]*\}/g)) {
        const fam = block[0].match(/font-family\s*:\s*([^;}]+)/);
        const wm = block[0].match(/font-weight\s*:\s*(\d{3})\b/);
        if (wm) add(familyKey(fam ? fam[1] : ''), Number(wm[1]));
      }
    } else {
      // Per className: a weight class co-located with a Grotesk family class
      // renders on Grotesk; otherwise on Inter (the default family).
      for (const cn of text.matchAll(/className=["'`]([^"'`]*)["'`]/g)) {
        const cls = cn[1];
        const hasGrotesk = /\bfont-Grotesk\b|\bfont-about\b/.test(cls);
        for (const [, w] of cls.matchAll(
          /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g,
        )) {
          add(hasGrotesk ? 'grotesk' : 'inter', CLASS_WEIGHTS[w]);
        }
      }
    }
  }
  // Browser default weight for any family that renders explicit weights.
  for (const family of Object.keys(used)) {
    if (used[family].size > 0) used[family].add(400);
  }
  return used;
}

let usedWeights;
let cssText;

beforeAll(() => {
  usedWeights = collectWeights();
  cssText = readFileSync(join(SRC, 'assets', 'fonts-latin.css'), 'utf8');
});

describe('font subsetting — pinned weight axes', () => {
  it('every configured fontsource source file exists (guard is not vacuous)', () => {
    expect(FONT_JOBS.length).toBeGreaterThanOrEqual(2);
    expect(LATIN_TEXT.length).toBeGreaterThan(100);
    for (const job of FONT_JOBS) {
      expect(statSync(job.src).size, `missing fontsource source: ${job.src}`).toBeGreaterThan(0);
    }
  });

  it("every font weight used in src/ is inside its family's pinned axis range", () => {
    expect(usedWeights.inter.size + usedWeights.grotesk.size).toBeGreaterThan(0);
    // Each family is validated against ITS OWN range — a weight rendered on
    // Grotesk (max 600) cannot pass because Inter (max 800) is broader.
    for (const job of FONT_JOBS) {
      const family = job.name === 'space-grotesk' ? 'grotesk' : 'inter';
      const { min, max } = job.axes.wght;
      const outOfRange = [...usedWeights[family]].filter((w) => w < min || w > max);
      expect(
        outOfRange,
        `${job.name} weights outside pinned ${min}-${max}: ${outOfRange.join(', ')}`,
      ).toEqual([]);
    }
  });

  it('the CSS declared ranges match the script config (no drift)', () => {
    // Two @font-face blocks, in the same order as FONT_JOBS (inter, grotesk).
    const ranges = [...cssText.matchAll(/font-weight:\s*(\d+)\s+(\d+);/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    expect(ranges).toEqual(FONT_JOBS.map((j) => [j.axes.wght.min, j.axes.wght.max]));
  });

  it('the CSS references the generated subset files', () => {
    for (const job of FONT_JOBS) {
      expect(cssText).toContain(`../assets/fonts/${job.out}`);
    }
  });

  it('the generated subset files exist and are smaller than the sources (after a build)', () => {
    // Generated by the vite plugin on every build/dev — skip if no build has
    // run yet (the weight-usage guard above is the always-on check).
    for (const job of FONT_JOBS) {
      const subsetPath = join(FONT_OUT_DIR, job.out);
      let subsetSize;
      try {
        subsetSize = statSync(subsetPath).size;
      } catch {
        continue; // no build yet — fine
      }
      const srcSize = statSync(job.src).size;
      expect(subsetSize).toBeLessThan(srcSize);
    }
  });
});
