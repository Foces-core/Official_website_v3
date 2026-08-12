// 'name' is handled separately (it has its own uniqueness check), so it is
// deliberately not in this list.
const STRING_FIELDS = ['tag', 'date', 'image', 'imageSet', 'desc'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Validates the event data shape (src/data/events.js). Returns an array of
 * human-readable problem strings; an empty array means the list is valid.
 *
 * The live data is guarded in tests/unit/eventsData.spec.js, which runs in CI
 * via `pnpm test:unit` — so a malformed event entry fails CI.
 *
 * Division of labor on file existence: this util checks shape only. Whether
 * the referenced webp files actually exist is enforced by the bundler (a
 * missing import fails the build); the reverse direction (unreferenced
 * files) is guarded by `pnpm check:assets`.
 *
 * @param {Array<object>} events
 * @returns {string[]}
 */
export function validateEvents(events) {
  const problems = [];
  const seenIds = new Set();
  const seenNames = new Set();

  events.forEach((event, index) => {
    const label = `event #${index + 1}`;

    if (event.id == null) {
      problems.push(`${label}: missing id`);
    } else if (typeof event.id !== 'number') {
      problems.push(`${label}: id must be a number`);
    } else if (seenIds.has(event.id)) {
      problems.push(`${label}: duplicate id ${event.id}`);
    } else {
      seenIds.add(event.id);
    }

    if (!isNonEmptyString(event.name)) {
      problems.push(`${label}: missing name`);
    } else if (seenNames.has(event.name)) {
      problems.push(`${label}: duplicate name "${event.name}"`);
    } else {
      seenNames.add(event.name);
    }

    STRING_FIELDS.forEach((field) => {
      if (!isNonEmptyString(event[field])) {
        problems.push(`${label}: missing ${field}`);
      }
    });

    if (event.websiteUrl != null && !isNonEmptyString(event.websiteUrl)) {
      problems.push(`${label}: websiteUrl must be a non-empty string when present`);
    }

    const imagesValid =
      Array.isArray(event.images) &&
      event.images.length > 0 &&
      event.images.every((src) => isNonEmptyString(src));
    const imageSetsValid =
      Array.isArray(event.imageSets) &&
      event.imageSets.length > 0 &&
      event.imageSets.every((src) => isNonEmptyString(src));

    if (!imagesValid) {
      problems.push(`${label}: images is not a non-empty array of strings`);
    }
    if (!imageSetsValid) {
      problems.push(`${label}: imageSets is not a non-empty array of strings`);
    }
    // Parity only when both arrays are structurally sound — an empty/missing
    // array is already flagged above, no need for a redundant mismatch line.
    if (imagesValid && imageSetsValid && event.images.length !== event.imageSets.length) {
      problems.push(
        `${label}: imageSets length ${event.imageSets.length} != images length ${event.images.length}`,
      );
    }
  });

  return problems;
}
