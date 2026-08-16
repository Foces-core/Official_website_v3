import { isNonEmptyString, checkUniqueKey } from './validationRules.js';

/**
 * Validates the Featuring carousel slide shape (src/data/echoSlides.js).
 * Returns an array of human-readable problem strings; an empty array means
 * the slides are valid.
 *
 * The live slides are guarded in tests/unit/echoSlides.spec.js, which runs in
 * CI via `pnpm test:unit` — so a malformed slide fails CI. Mirrors
 * validateTeam.js / validateEvents.js: shape only. Whether the referenced
 * webp files exist is enforced by the bundler (a missing import fails the
 * build); the srcset width rules are owned by the srcset module.
 *
 * @param {Array<{image: string, imageSet: string, blur: string, alt: string}>} slides
 * @returns {string[]}
 */
export function validateEchoSlides(slides) {
  const problems = [];
  const seenAlts = new Set();

  slides.forEach((slide, index) => {
    const label = `slide #${index + 1}`;

    if (!isNonEmptyString(slide.alt)) {
      problems.push(`${label}: missing alt`);
    } else {
      checkUniqueKey(seenAlts, slide.alt, `${label}: duplicate alt "${slide.alt}"`, problems);
    }

    if (!isNonEmptyString(slide.image)) {
      problems.push(`${label}: missing image`);
    }

    if (!isNonEmptyString(slide.imageSet)) {
      problems.push(`${label}: missing imageSet`);
    }

    // Blur placeholder is required (blur-up lazy loading, like the Execom
    // cards) — a slide without one silently falls back to a plain load.
    if (!isNonEmptyString(slide.blur)) {
      problems.push(`${label}: missing blur`);
    }
  });

  return problems;
}
