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
      // Cyclomatic complexity cap (matching the SonarQube gate): keep every
      // function at 4 or below so branches stay testable. Refactor instead of
      // escalating the limit — deep nesting is a code smell, not a lint to
      // silence.
      complexity: ['error', { max: 4 }],
    },
  },
  {
    // Legacy complexity debt — these files predate the max-4 gate and are
    // exempted until refactored. The rule applies to every file NOT listed
    // here (including all new code). Remove a file from this list once its
    // functions sit at or below 4; the gate then guards it again.
    files: [
      'scripts/maintenance/actionlint-check.mjs',
      'scripts/maintenance/check-orphan-assets.mjs',
      'scripts/maintenance/check-specs.mjs',
      'scripts/probes/boot-profile.mjs',
      'scripts/probes/constants.mjs',
      'scripts/probes/mobile-probe.mjs',
      'scripts/probes/perf-test.mjs',
      'scripts/static-server.mjs',
      'src/Components/AboutUs/AboutUs.jsx',
      'src/Components/AboutUs/easterEggCelebration.js',
      'src/Components/BlurImage/BlurImage.jsx',
      'src/Components/BlurImage/useBlurImage.js',
      'src/Components/Execom/TeamCarousel.jsx',
      'src/Components/HeroStage/heroWavesStage.js',
      'src/Components/ScrollGate/scrollGateLogic.js',
      'src/Components/SectionSkeleton/SectionSkeleton.jsx',
      'src/hooks/useCarousel.js',
      'src/hooks/useContactForm.js',
      'src/hooks/useCubeDrag.js',
      'src/hooks/useFocusRestore.js',
      'src/hooks/useFocusTrap.js',
      'src/hooks/useLowPower.js',
      'src/Pages/EventPage/EventCard.jsx',
      'src/Pages/LandingPage/Navbar/Navbar.jsx',
      'src/Pages/LandingPage/Navbar/navSpy.js',
      'src/utils/aosGating.js',
      'src/utils/ariaActivation.js',
      'src/utils/carouselGeometry.js',
      'src/utils/contactDraft.js',
      'src/utils/contactSubmitLogic.js',
      'src/utils/cubePhysics.js',
      'src/utils/detectProfile.js',
      'src/utils/errorRecoveryLogic.js',
      'src/utils/frameScheduler.js',
      'src/utils/imagePolicy.js',
      'src/utils/keyboardLock.js',
      'src/utils/navigationCoordinator.js',
      'src/utils/overlayLifecycle.js',
      'src/utils/prefetchGate.js',
      'src/utils/priorityScheduler.js',
      'src/utils/resumeReload.js',
      'src/utils/routePrefetchLogic.js',
      'src/utils/safeStorage.js',
      'src/utils/validateContactForm.js',
      'src/utils/validateEchoSlides.js',
      'src/utils/validateEvents.js',
      'src/utils/validateTeam.js',
      'src/utils/validationRules.js',
      'tests/home.spec.js',
      'tests/unit/aosGating.spec.js',
      'tests/unit/detectProfile.spec.js',
      'tests/unit/fontSubset.spec.js',
      'tests/unit/useAosFailsafe.spec.jsx',
      'tests/unit/useCubeDrag.spec.jsx',
      'vite.config.js',
    ],
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
    files: ['tests/unit/**/*.spec.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
];
