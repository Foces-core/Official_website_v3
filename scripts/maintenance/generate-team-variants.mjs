#!/usr/bin/env node
/**
 * Generate right-sized -400.webp variants for the team roster photos.
 *
 * Why: the 11 Execom member photos shipped as single full-size webp
 * (600-800px wide, 26-120 KB each — 748 KB total). The carousel cards never
 * render wider than ~360px, so a phone or 1x desktop downloaded the same
 * oversized file a retina desktop did. These -400.webp variants (400px wide,
 * enough detail to recognize a person at card size) are referenced by
 * src/data/team.js srcset attributes; the full-size stays as the srcset max
 * candidate for retina/zoom, and each member also gets a ?blur&w=20 LQIP.
 *
 * Usage:  node scripts/maintenance/generate-team-variants.mjs
 * Run this whenever a member photo is added/replaced. Files are committed
 * (matching the events/featuring -400/-800/-480/-960 convention).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = join(ROOT, 'src', 'assets');
const TARGET_WIDTH = 400;

// The member photos in src/data/team.js, plus the advisor banner (gopakumar
// renders at <=208px, so it right-sizes the same way).
const MEMBER_FILES = [
  'aleeta',
  'lisha1',
  'steve',
  'anna_rachel',
  'amanul',
  'abel',
  'saniya',
  'sebin',
  'anjitha',
  'abhirami_p',
  'devadarsana',
  'gopakumar',
];

async function generateVariants() {
  let totalBefore = 0;
  let totalAfter = 0;
  for (const name of MEMBER_FILES) {
    const src = join(ASSETS, `${name}.webp`);
    const out = join(ASSETS, `${name}-400.webp`);
    const srcBuf = await readFile(src);
    const variant = await sharp(srcBuf)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    // Never write a variant bigger than the source — and never silently
    // skip: if the source is already ≤400px wide (or re-encoding doesn't
    // shrink it), a stale -400.webp of a previous photo could linger and the
    // roster import would silently point at the wrong face. Fail loudly so
    // the asset is fixed before release.
    if (variant.length >= srcBuf.length) {
      throw new Error(
        `cannot generate a smaller -400.webp for "${name}" ` +
          `(source ${srcBuf.length} B, variant ${variant.length} B). ` +
          'Supply a photo wider than 400px, or regenerate the variant manually.',
      );
    }
    await writeFile(out, variant);
    totalBefore += srcBuf.length;
    totalAfter += variant.length;
    console.log(
      `  ${name}: ${(srcBuf.length / 1024).toFixed(1)} KB → ${(variant.length / 1024).toFixed(1)} KB (-${Math.round(
        (1 - variant.length / srcBuf.length) * 100,
      )}%)`,
    );
  }
  console.log(
    `\nTeam member photos: ${(totalBefore / 1024).toFixed(1)} KB → ${(totalAfter / 1024).toFixed(1)} KB at 400w`,
  );
}

generateVariants().catch((err) => {
  console.error('generate-team-variants failed:', err);
  process.exit(1);
});
