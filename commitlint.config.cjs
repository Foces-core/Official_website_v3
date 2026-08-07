// Commit message rules (enforced by the husky commit-msg hook and CI).
// Conventional Commits + the repo's custom `a11y` type (used in history).
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
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
  },
};
