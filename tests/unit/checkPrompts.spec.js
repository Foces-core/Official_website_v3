import { describe, expect, it } from 'vitest';
import {
  STUDIO_EXCLUSION_FILES,
  checkAdrPointerFresh,
  checkDocPaths,
  checkGlossaryOwnership,
  checkSingleCoderabbitConfig,
  checkStudioExclusions,
  extractDocPaths,
  maxAdrNumber,
  runAllChecks,
} from '../../scripts/maintenance/check-prompts.mjs';

// 1. Exactly one active CodeRabbit config.
describe('checkSingleCoderabbitConfig', () => {
  const onlyRoot = (rel) => rel === '.coderabbit.yaml';

  it('passes with only the root config present', () => {
    expect(checkSingleCoderabbitConfig(onlyRoot)).toEqual([]);
  });

  it('flags the legacy .github/coderabbit.yaml fork', () => {
    const findings = checkSingleCoderabbitConfig(() => true);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('.github/coderabbit.yaml');
  });

  it('flags a missing root config', () => {
    expect(checkSingleCoderabbitConfig(() => false)[0]).toContain('missing root');
  });
});

// 2. No stale ADR range pin.
describe('checkAdrPointerFresh', () => {
  it('passes when no range is pinned (pointer to the index)', () => {
    expect(checkAdrPointerFresh('see docs/adr/ index', 15)).toEqual([]);
  });

  it('passes when the pinned range matches the index', () => {
    expect(checkAdrPointerFresh('ADR-0001 through ADR-0015', 15)).toEqual([]);
  });

  it('flags a stale pinned range (the real ADR-0010 vs ADR-0015 bug)', () => {
    const findings = checkAdrPointerFresh('ADR-0001 through ADR-0010', 15);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('ADR-0010');
  });
});

describe('maxAdrNumber', () => {
  it('ignores the template and non-ADR files', () => {
    expect(maxAdrNumber(['_template.md', 'README.md', '0009-x.md', '0015-y.md'])).toBe(15);
  });

  it('returns 0 for an empty dir', () => {
    expect(maxAdrNumber([])).toBe(0);
  });
});

// 3. Studio exclusion parity across tool configs.
describe('checkStudioExclusions', () => {
  const healthy = () => `# comment\nfoces-webv23/**\n`;

  it('passes when every config mentions the studio', () => {
    expect(checkStudioExclusions(healthy)).toEqual([]);
  });

  it('covers the full exclusion list (no silent shrink)', () => {
    expect(STUDIO_EXCLUSION_FILES).toContain('.coderabbit.yaml');
    expect(STUDIO_EXCLUSION_FILES).toContain('lint-staged.config.js');
    expect(STUDIO_EXCLUSION_FILES.length).toBeGreaterThanOrEqual(6);
  });

  it('names the file that drifted', () => {
    const readFile = (f) => (f === 'knip.json' ? '{ "ignore": [] }' : healthy());
    const findings = checkStudioExclusions(readFile);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('knip.json');
  });

  it('flags a missing config file', () => {
    const findings = checkStudioExclusions(() => null);
    expect(findings).toHaveLength(STUDIO_EXCLUSION_FILES.length);
  });
});

// 4. Doc paths resolve.
describe('extractDocPaths / checkDocPaths', () => {
  it('extracts scoped path tokens, dedupes, strips trailing punctuation', () => {
    const md =
      'See `src/data/team.js`, `src/data/team.js` and `src/utils/`. Ignore `pnpm install`.';
    expect(extractDocPaths(md)).toEqual(['src/data/team.js', 'src/utils/']);
  });

  it('flags only the ghost path', () => {
    const findings = checkDocPaths(
      '`src/data/team.js` plus `src/utils/ghost.js`',
      (p) => p === 'src/data/team.js',
      () => [],
    );
    expect(findings).toEqual([
      'AGENTS.md names src/utils/ghost.js, which does not exist — update the Map, not the tree',
    ]);
  });

  it('resolves glob tokens against the parent dir listing', () => {
    const listDir = (d) => (d === 'tests' ? ['home.spec.js', 'helpers.js'] : null);
    expect(checkDocPaths('`tests/*.spec.js`', () => false, listDir)).toEqual([]);
    expect(checkDocPaths('`tests/*.ghost.js`', () => false, listDir)[0]).toContain(
      'matches nothing',
    );
    expect(checkDocPaths('`docs/nope/*.md`', () => false, listDir)[0]).toContain('does not exist');
  });
});

// 5. Canonical glossary named.
describe('checkGlossaryOwnership', () => {
  it('passes when a canonical glossary is named', () => {
    expect(checkGlossaryOwnership('CONTEXT.md is canonical for agents')).toEqual([]);
  });

  it('flags the ambiguous two-glossary state', () => {
    const findings = checkGlossaryOwnership('see CONTEXT.md and UBIQUITOUS_LANGUAGE.md');
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('canonical');
  });
});

// End to end over stub FS seams.
describe('runAllChecks', () => {
  const healthyFs = {
    exists: (rel) => rel !== '.github/coderabbit.yaml',
    readFile: (rel) => {
      if (rel === 'CLAUDE.md') return 'canonical glossary: CONTEXT.md; see docs/adr/ index';
      return '`src/data/team.js` and foces-webv23';
    },
    adrFileNames: ['0015-x.md'],
  };

  it('is clean on a healthy tree', () => {
    // AGENTS.md stub names one real-checked path; stub exists() true covers it.
    expect(runAllChecks(healthyFs)).toEqual([]);
  });

  it('aggregates findings from every section', () => {
    const findings = runAllChecks({
      exists: (rel) => rel === '.github/coderabbit.yaml',
      readFile: () => 'through ADR-0001, see CONTEXT.md and UBIQUITOUS_LANGUAGE.md',
      adrFileNames: ['0015-x.md'],
    });
    const joined = findings.join('\n');
    expect(joined).toContain('.github/coderabbit.yaml');
    expect(joined).toContain('ADR-0001');
    expect(joined).toContain('foces-webv23');
    expect(joined).toContain('canonical');
  });
});
