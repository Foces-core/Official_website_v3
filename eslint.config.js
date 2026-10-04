import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';

export default [
  // node_modules and .git are ignored by default in flat config.
  { ignores: ['dist', 'foces-webv23', 'test-results', 'playwright-report', '.stryker-tmp'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  reactRefresh.configs.vite,
  importX.flatConfigs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      react: { version: '19.2' },
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'import-x/no-unresolved': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },
  // Cyclomatic complexity cap, enforced rather than documented.
  //
  // Previously this lived only as an AGENTS.md note with no runtime gate.
  //
  // Ratchet, NOT aspiration. Measured across src/ before setting: worst is 33
  // (Navbar.jsx), and 81 functions exceed 4. A max of 4 would have failed the
  // build on 81 errors, so the cap starts at the real ceiling and tightens only
  // as code is refactored. Lower it in the same PR that brings real code under.
  //
  // CRAP(m) = c^2 * (1 - cov)^3 + c; see scripts/crap-gate.mjs.
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    rules: {
      complexity: ['error', { max: 33 }],
    },
  },
  {
    // Test files are excluded on purpose: assertion and fixture branching is
    // not production risk, and gating it produces churn without signal.
    files: ['tests/**/*.js', 'tests/**/*.jsx', '**/*.test.js', '**/*.spec.js'],
    rules: {
      complexity: 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
    },
  },
  {
    files: ['vite.config.js', 'lint-staged.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // Unit tests use Vitest's globals directly (describe/it/expect/vi).
    files: ['tests/unit/**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
];
