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

// The tailwind weight class names this guard tracks → numeric weight.
const WEIGHT_CLASSES = 'thin|extralight|light|normal|medium|semibold|bold|extrabold|black';
const WEIGHT_CLASS_RE = new RegExp(`font-(${WEIGHT_CLASSES})\\b`, 'g');
const GROTESK_CLASS_RE = /\bfont-Grotesk\b|\bfont-about\b/; // ---- JSX scanner (depth-aware, single pass) --------------------------------
//
// The guard must attribute a weight class to the family it actually renders
// with — and CSS inheritance means an element nested inside a Grotesk
// container (font-Grotesk / font-about) renders on Space Grotesk even when its
// own className only carries a weight class. That is the fake-bold path: a
// font-bold (700) inside such a container would be browser-synthesized, since
// the pinned Grotesk subset caps at 600.
//
// The scanner walks tag boundaries with a state machine that tracks quotes,
// template literals, and ${...} nesting — so `>` inside an expression
// (e.g. `${size > 0 ? 'font-bold' : ''}`) does not terminate the tag, and
// expression-wrapped classNames (className={`...`}) are read from their raw
// text. It returns BOTH family sets from one traversal; every weight class is
// attributed exactly once (no double-credit to Inter).

// Scan forward from `i` over a value: "...", '...', `...`, or {...} (braces
// depth-tracked so nested ${...} and objects are skipped atomically). Returns
// the raw text of the value and the index just past it.
function scanValue(text, i) {
  const start = i;
  if (text[i] === '"' || text[i] === "'" || text[i] === '`') {
    const quote = text[i];
    i += 1;
    while (i < text.length && text[i] !== quote) i += 1;
    return [text.slice(start, i + 1), i + 1];
  }
  if (text[i] === '{') {
    let depth = 0;
    let inQuote = null;
    while (i < text.length) {
      const c = text[i];
      if (inQuote) {
        if (c === inQuote) inQuote = null;
      } else if (c === '"' || c === "'" || c === '`') {
        inQuote = c;
      } else if (c === '{') {
        depth += 1;
      } else if (c === '}') {
        depth -= 1;
        if (depth === 0) return [text.slice(start, i + 1), i + 1];
      }
      i += 1;
    }
  }
  return [text.slice(start, i), i];
}

// Find the raw className value inside a tag's attribute string, or ''.
// Handles className="...", className='...', className={`...`}, and
// className={cond ? 'a font-bold' : ''} — all returned as raw text so the
// class regexes below can scan them.
function classNameOf(attrs) {
  for (let i = 0; i < attrs.length;) {
    const eq = attrs.indexOf('=', i);
    if (eq === -1) return '';
    const name = attrs.slice(i, eq).trim().split(/\s+/).pop() || '';
    const [value, next] = scanValue(attrs, eq + 1);
    if (name === 'className') return value;
    i = next;
  }
  return '';
}

// One depth-aware traversal of a JSX file → { inter, grotesk } weight sets.
function scanJsxWeights(text) {
  const used = { inter: new Set(), grotesk: new Set() };
  const add = (family, weight) => used[family].add(weight);
  // Stack of "does this open element carry a Grotesk marker" flags.
  const stack = [];

  for (let i = 0; i < text.length;) {
    const lt = text.indexOf('<', i);
    if (lt === -1) break;
    if (text[lt + 1] === '/') {
      // Closing tag — pop the matching open element.
      if (stack.length > 0) stack.pop();
      i = lt + 2;
      continue;
    }
    // Opening tag: read to the matching '>' (quote/brace aware).
    let j = lt + 1;
    let depth = 0;
    let inQuote = null;
    while (j < text.length) {
      const c = text[j];
      if (inQuote) {
        if (c === inQuote) inQuote = null;
      } else if (c === '"' || c === "'" || c === '`') {
        inQuote = c;
      } else if (c === '{') {
        depth += 1;
      } else if (c === '}') {
        depth -= 1;
      } else if (c === '>' && depth === 0) {
        break;
      }
      j += 1;
    }
    const tag = text.slice(lt + 1, j);
    i = j + 1;

    const tagName = tag.match(/^[A-Za-z][\w.-]*/)?.[0] || '';
    if (!tagName) continue; // fragment, comment, or stray '<' — skip
    const isGrotesk = GROTESK_CLASS_RE.test(classNameOf(tag));
    const family = isGrotesk || stack.some(Boolean) ? 'grotesk' : 'inter';
    const cls = classNameOf(tag);
    for (const [, w] of cls.matchAll(WEIGHT_CLASS_RE)) add(family, CLASS_WEIGHTS[w]);
    const selfClosing = /\/\s*>$/.test(tag);
    if (!selfClosing) stack.push(isGrotesk);
  }
  return used;
}

// Per-family weights actually used in src/. JSX files use the ancestry-aware
// scanner (every weight class attributed once, to the family it renders on);
// CSS rules read the font-family from the same rule block. A family that
// renders any explicit weight also gets its browser default (400).
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
      const jsx = scanJsxWeights(text);
      for (const w of jsx.inter) add('inter', w);
      for (const w of jsx.grotesk) add('grotesk', w);
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

  it('scanJsxWeights attributes nested weights to Grotesk exactly once (fake-bold path)', () => {
    // A weight class nested INSIDE a font-Grotesk container renders on Grotesk
    // via CSS inheritance even though the element itself has no Grotesk class.
    // A naive co-location scan would silently credit this to Inter, letting a
    // font-bold (700, above Grotesk's pinned 600 cap) slip through as
    // browser-synthesized fake-bold. The scan returns BOTH sets from one
    // traversal, so a weight is never double-credited to Inter.
    const inherited = scanJsxWeights(`
      <div className="font-Grotesk">
        <span className="font-semibold">native 600</span>
        <h3 className="font-bold">synthesized 700 — must be caught</h3>
      </div>
    `);
    expect([...inherited.grotesk].sort()).toEqual([600, 700]);
    expect(inherited.inter.size).toBe(0); // never double-attributed to Inter

    // A weight class on an element with NO Grotesk ancestry stays Inter.
    const plain = scanJsxWeights(`<h2 className="font-extrabold">Inter 800</h2>`);
    expect(plain.grotesk.size).toBe(0);
    expect([...plain.inter].sort()).toEqual([800]);

    // Self-closing + nested deeper chains still track correctly.
    const chain = scanJsxWeights(`
      <div className="font-about">
        <div>
          <span className="font-bold">inherited through two levels</span>
        </div>
        <img className="font-medium" alt="" />
      </div>
    `);
    expect([...chain.grotesk].sort()).toEqual([500, 700]);
    expect(chain.inter.size).toBe(0);
  });

  it('scanJsxWeights reads expression-wrapped classNames and ${...} expressions', () => {
    // className={`font-Grotesk ${size > 0 ? 'font-bold' : ''}`}: the tag's '>' is
    // inside the ${...} expression and the className is brace-wrapped — a naive
    // tag regex terminates early and never attributes the nested weight. The
    // depth-aware scanner must catch the 700 as Grotesk.
    const expr = scanJsxWeights(
      "const el = <div className={`font-Grotesk ${size > 0 ? 'font-bold' : ''}`}>text</div>;",
    );
    expect([...expr.grotesk].sort()).toEqual([700]);
    expect(expr.inter.size).toBe(0);

    // A Grotesk container with a plain quoted className still works.
    const quoted = scanJsxWeights(
      '<div className="font-Grotesk"><b className="font-bold">x</b></div>',
    );
    expect([...quoted.grotesk].sort()).toEqual([700]);
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
