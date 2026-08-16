import {
  isNonEmptyString,
  isNumber,
  findDuplicateWidth,
  checkUniqueKey,
} from './validationRules.js';

// 'name' is handled separately (it has its own uniqueness check), so it is
// deliberately not in this list.
const STRING_FIELDS = ['tag', 'date', 'desc'];

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
    } else if (!isNumber(event.id)) {
      problems.push(`${label}: id must be a number`);
    } else {
      checkUniqueKey(seenIds, event.id, `${label}: duplicate id ${event.id}`, problems);
    }

    if (!isNonEmptyString(event.name)) {
      problems.push(`${label}: missing name`);
    } else {
      checkUniqueKey(seenNames, event.name, `${label}: duplicate name "${event.name}"`, problems);
    }

    STRING_FIELDS.forEach((field) => {
      if (!isNonEmptyString(event[field])) {
        problems.push(`${label}: missing ${field}`);
      }
    });

    if (event.websiteUrl != null && !isNonEmptyString(event.websiteUrl)) {
      problems.push(`${label}: websiteUrl must be a non-empty string when present`);
    }

    // photos are { url, srcset, blur? } objects (src/utils/eventPhotos.js) —
    // the pairing is structural, so no parity check is needed; only shape +
    // width accuracy. `blur` is optional (only the first event's primary
    // carries an LQIP) but must be a non-empty string when present.
    const photosValid =
      Array.isArray(event.photos) &&
      event.photos.length > 0 &&
      event.photos.every(
        (photo) =>
          photo &&
          typeof photo === 'object' &&
          isNonEmptyString(photo.url) &&
          isNonEmptyString(photo.srcset),
      );

    if (!photosValid) {
      problems.push(`${label}: photos must be a non-empty array of { url, srcset }`);
    } else {
      event.photos.forEach((photo, photoIndex) => {
        // Dedicated diagnostic (not folded into the generic photos error) so
        // a bad blur is reported as what it is. Own-property check: an
        // explicit null is a supplied-but-invalid value and must be rejected;
        // an omitted blur stays valid.
        if (Object.hasOwn(photo, 'blur') && !isNonEmptyString(photo.blur)) {
          problems.push(
            `${label}: photo #${photoIndex + 1} blur must be a non-empty string when present`,
          );
        }
        const dup = findDuplicateWidth(photo.srcset);
        if (dup) {
          problems.push(`${label}: photo "${dup[0]}" declared at both ${dup[1]}w and ${dup[2]}w`);
        }
      });
    }
  });

  return problems;
}
