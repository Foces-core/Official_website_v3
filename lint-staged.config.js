/**
 * lint-staged — run root tooling on staged files, NEVER on the archived
 * foces-webv23/ Sanity studio (AGENTS.md + ADR-0004: off-limits, pinned to
 * Sanity 3 / React 18 on purpose).
 *
 * Root eslint (flat-config `ignores`) and prettier (`.prettierignore`) would
 * already no-op on studio paths, but filtering here keeps them out of the
 * staged file list entirely, so the guarantee does not depend on either
 * tool's own ignore behavior.
 *
 * Function syntax notes (lint-staged v17):
 * - Function configs run their returned commands VERBATIM (no file args are
 *   appended), so the filtered file list must be embedded in the commands.
 * - Filepaths arrive ABSOLUTE (e.g. `D:/git folder/...` on Windows), so the
 *   studio check must normalize them relative to the cwd — a raw prefix
 *   match against `foces-webv23/` silently matches nothing.
 * - The command parser splits on whitespace — single-quote every path or
 *   paths containing spaces get truncated mid-argument.
 */
import path from 'node:path';

const isStudioPath = (file) => {
  const rel = path.relative(process.cwd(), file);
  return rel.split(path.sep)[0] === 'foces-webv23';
};
const quote = (file) => `'${file}'`;

export default {
  '*.{js,jsx,cjs,mjs}': (files) => {
    const keep = files.filter((file) => !isStudioPath(file));
    if (!keep.length) return [];
    const list = keep.map(quote).join(' ');
    return [`eslint --fix --report-unused-disable-directives ${list}`, `prettier --write ${list}`];
  },
  '*.{json,css,md,html}': (files) => {
    const keep = files.filter((file) => !isStudioPath(file));
    if (!keep.length) return [];
    return [`prettier --write ${keep.map(quote).join(' ')}`];
  },
};
