/* global process -- tests execute in node (vitest), only browser/vitest globals are declared */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Guard for src/assets/aos-min.css — the hand-picked subset of the AOS
 * stylesheet. AOS CSS hides [data-aos] elements (opacity/transform) until
 * .aos-animate is added, so any data-aos value the CSS doesn't cover leaves
 * that element permanently invisible. This spec scans every source file for
 * data-aos attribute values and fails when a value falls outside the subset —
 * adding a new animation/duration must extend aos-min.css in the same change.
 */

const SUPPORTED_ANIMATIONS = ['flip-up', 'flip-right', 'fade-up', 'fade-down', 'zoom-in'];
// 400 is the AOS init default: elements without an explicit data-aos-duration
// match body[data-aos-duration="400"] (AOS writes the default onto <body>).
const SUPPORTED_DURATIONS = [300, 400, 750, 1000];

// Tests run from the repo root (vitest cwd); resolve src/ relative to it.
const srcRoot = resolve(process.cwd(), 'src');

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(jsx|js)$/.test(entry) && !full.includes('foces-webv23') ? [full] : [];
  });
}

const sourceFiles = walk(srcRoot);
const sources = sourceFiles
  .map((f) => readFileSync(f, 'utf8'))
  .filter((text) => text.includes('data-aos'));

const used = {
  animations: new Set(),
  durations: new Set(),
  easings: new Set(),
  delays: new Set(),
};

for (const text of sources) {
  for (const attr of ['data-aos', 'data-aos-duration', 'data-aos-easing', 'data-aos-delay']) {
    const re = new RegExp(`${attr}="([^"]*)"`, 'g');
    for (const match of text.matchAll(re)) {
      const value = match[1];
      if (attr === 'data-aos') used.animations.add(value);
      else if (attr === 'data-aos-duration') used.durations.add(value);
      else if (attr === 'data-aos-easing') used.easings.add(value);
      else used.delays.add(value);
    }
  }
}

describe('aos-min.css — every used data-aos value is covered', () => {
  it('the scan found [data-aos] usage (guard is not vacuously passing)', () => {
    expect(used.animations.size).toBeGreaterThan(0);
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('every used animation is in the minimal stylesheet', () => {
    const missing = [...used.animations].filter((a) => !SUPPORTED_ANIMATIONS.includes(a));
    expect(missing).toEqual([]);
  });

  it('every used duration is in the minimal stylesheet (plus the 400 default)', () => {
    const missing = [...used.durations].filter((d) => !SUPPORTED_DURATIONS.map(String).includes(d));
    expect(missing).toEqual([]);
  });

  it('no easings or delays are used (the subset ships none)', () => {
    expect([...used.easings]).toEqual([]);
    expect([...used.delays]).toEqual([]);
  });

  it('the stylesheet actually contains a rule for each supported animation', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/assets/aos-min.css'), 'utf8');
    for (const animation of SUPPORTED_ANIMATIONS) {
      expect(css).toContain(`[data-aos='${animation}']`);
    }
  });

  it('the stylesheet actually contains a duration rule for each supported duration', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/assets/aos-min.css'), 'utf8');
    for (const duration of SUPPORTED_DURATIONS) {
      expect(css).toContain(`data-aos-duration='${duration}'`);
    }
  });
});
