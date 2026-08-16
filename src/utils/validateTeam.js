import { isNonEmptyString, checkUniqueKey } from './validationRules.js';

/**
 * Validates the team roster shape (src/data/team.js). Returns an array of
 * human-readable problem strings; an empty array means the roster is valid.
 *
 * The live roster is guarded in tests/unit/teamData.spec.js, which runs in CI
 * via `pnpm test:unit` — so a malformed entry fails CI. Mirrors
 * validateEvents.js: shape only. Whether the referenced webp files exist is
 * enforced by the bundler (a missing import fails the build).
 *
 * @param {Array<{name: string, img: string, srcset?: string, blur?: string, role: string}>} members
 * @returns {string[]}
 */
export function validateTeam(members) {
  const problems = [];
  const seenNames = new Set();

  members.forEach((member, index) => {
    const label = `member #${index + 1}`;

    if (!isNonEmptyString(member.name)) {
      problems.push(`${label}: missing name`);
    } else {
      checkUniqueKey(seenNames, member.name, `${label}: duplicate name "${member.name}"`, problems);
    }

    if (!isNonEmptyString(member.role)) {
      problems.push(`${label}: missing role`);
    }

    if (!isNonEmptyString(member.img)) {
      problems.push(`${label}: missing img`);
    }

    // `srcset` is optional (members without responsive candidates are plain
    // lazy loads) but must be a non-empty string when present. Same own-
    // property semantics as `blur` below: an explicit null is supplied-but-
    // invalid and must be rejected; an omitted srcset stays valid.
    if (
      Object.prototype.hasOwnProperty.call(member, 'srcset') &&
      !isNonEmptyString(member.srcset)
    ) {
      problems.push(`${label}: srcset must be a non-empty string when present`);
    }

    // `blur` is optional (only the lead images carry an LQIP) but must be a
    // non-empty string when present. Own-property check (not `in`, which also
    // sees inherited properties, and not `!= null`, which lets explicit null
    // slip through): an explicit null is a supplied-but-invalid value and
    // must be rejected, while an omitted blur stays valid.
    if (Object.prototype.hasOwnProperty.call(member, 'blur') && !isNonEmptyString(member.blur)) {
      problems.push(`${label}: blur must be a non-empty string when present`);
    }
  });

  return problems;
}
