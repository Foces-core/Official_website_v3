// Build-time font subsetting — runs automatically for every dev and CI run
// (wired as a vite plugin in vite.config.js, so any `vite build`/`vite dev`
// invocation regenerates the subset fonts before the app builds).
//
// The site uses a narrow weight band of each variable font (Inter 300–800,
// Space Grotesk 300–600), but the @fontsource-variable packages ship the full
// weight axis (Inter 100–900, Grotesk 300–700). Restricting the `wght` axis
// shrinks the files for every visitor while keeping them variable fonts with
// the exact same latin glyph set (the fontsource latin unicode-range — no
// glyph regression, only the unused weight deltas are dropped). Pure JS via
// subset-font (harfbuzz wasm) — no Python/fonttools dependency.
//
// Fallback: if subsetting fails for a font, the ORIGINAL font is copied to
// the output path so a build can never break — the app just ships the
// un-subset font for that run.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FONT_OUT_DIR = join(ROOT, 'src', 'assets', 'fonts');

// The exact glyph set the current @fontsource latin subsets ship (their
// documented unicode-range). Keeping it identical means the subset can only
// ever shrink the weight axis, never drop a character the site renders.
export const LATIN_UNICODE_RANGES = [
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0304, 0x0308],
  [0x0329, 0x0329],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
];

export const LATIN_TEXT = LATIN_UNICODE_RANGES.map(([lo, hi]) => {
  let chars = '';
  for (let cp = lo; cp <= hi; cp += 1) chars += String.fromCodePoint(cp);
  return chars;
}).join('');

// Single source of truth for the pinned weight axes — tests/unit/fontSubset
// reads these and fails if src/ ever uses a weight outside a range.
export const FONT_JOBS = [
  {
    name: 'inter',
    src: join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'),
    out: 'inter-latin-wght-normal.subset.woff2',
    axes: { wght: { min: 300, max: 800 } },
  },
  {
    name: 'space-grotesk',
    src: join(
      ROOT,
      'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
    ),
    out: 'space-grotesk-latin-wght-normal.subset.woff2',
    axes: { wght: { min: 300, max: 600 } },
  },
];

export async function subsetFonts() {
  await mkdir(FONT_OUT_DIR, { recursive: true });
  for (const job of FONT_JOBS) {
    const outPath = join(FONT_OUT_DIR, job.out);
    try {
      const src = await readFile(job.src);
      const subset = await subsetFont(src, LATIN_TEXT, {
        targetFormat: 'woff2',
        variationAxes: job.axes,
      });
      if (subset.length >= src.length) {
        throw new Error(`subset not smaller (${subset.length} >= ${src.length})`);
      }
      await writeFile(outPath, subset);
      console.log(
        `[fonts] ${job.name}: ${(src.length / 1024).toFixed(1)} KB → ${(subset.length / 1024).toFixed(1)} KB (wght ${job.axes.wght.min}–${job.axes.wght.max})`,
      );
    } catch (err) {
      // Fallback: ship the original font so the build never breaks. If the
      // source is also missing, copyFile throws and the build fails loudly.
      await copyFile(job.src, outPath);
      console.warn(`[fonts] ${job.name}: subsetting failed (${err.message}) — using full font`);
    }
  }
}

// Run only when executed directly (the vite plugin / spec import the module).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  subsetFonts().catch((err) => {
    console.error('[fonts] subset-fonts failed:', err);
    process.exit(1);
  });
}
