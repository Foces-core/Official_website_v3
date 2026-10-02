// Commit message rules (enforced by the husky commit-msg hook and CI).
// Conventional Commits + the repo's custom `a11y` type (used in history).
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // AGENTS.md 3.1 documents the format as `type(scope):` — enforce it.
    // config-conventional leaves scope optional, so a bare `chore:` used to
    // pass. `Validate commit messages` is a branch-protection required check,
    // so this now blocks the merge instead of merely documenting intent.
    'scope-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'a11y',
      ],
    ],
    // Dependabot PR bodies contain long URLs/commit links that regularly blow
    // past 100 chars; rejecting them would block every bump PR.
    'body-max-line-length': [0, 'always'],
  },
};
