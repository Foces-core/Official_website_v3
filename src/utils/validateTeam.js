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
 * @param {Array<{name: string, img: string, role: string}>} members
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
  });

  return problems;
}
