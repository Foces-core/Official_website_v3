import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';

export default [
  // node_modules and .git are ignored by default in flat config.
  { ignores: ['dist', 'foces-webv23', 'test-results', 'playwright-report'] },
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
      // Complexity cap moved to AGENTS.md as a governance rule —
      // future agents MUST keep functions at cyclomatic complexity ≤ 4.
      // No ESLint gate is enforced; rely on code review + the agent
      // AGENTS.md directive to keep scores low without a runtime gate.
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
    files: ['tests/unit/**/*.spec.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
];
