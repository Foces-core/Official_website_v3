#!/usr/bin/env node
/**
 * Prompt-parity guard (Wulfie Bain audit follow-up).
 *
 * The repo's agent-instruction layer (AGENTS.md, CLAUDE.md, .coderabbit.yaml,
 * …) is a prompt: it rots the same way product prompts do — accretion without
 * re-reads, implicit knowledge, and rules duplicated across conditional files
 * that nobody reviews as a whole. This check is the eval for that prompt. It
 * fails (exit 1) with named findings instead of an aggregate percentage, so
 * the PR that introduces the drift is the PR that fixes it.
 *
 * What it asserts:
 *   1. Exactly one active CodeRabbit config (root .coderabbit.yaml). A legacy
 *      .github/coderabbit.yaml silently forks review strictness (it disagrees
 *      on early_access, path_filters, and pre_merge_checks).
 *   2. CLAUDE.md pins no stale ADR range ("through ADR-0010" while docs/adr/
 *      indexes ADR-0015 was a real accretion bug).
 *   3. Every tool config still encodes the foces-webv23 off-limits rule —
 *      the exclusion lives in ~7 files and one drift re-arms the studio.
 *   4. Every src/docs/scripts/tests/public path named in AGENTS.md exists —
 *      the Map section is the accretion hotspot and must not point at ghosts.
 *   5. CONTEXT.md is the single glossary — UBIQUITOUS_LANGUAGE.md was merged
 *      into it (aliases, relationships, dialogue, ambiguities) and must not
 *      come back, and CLAUDE.md must still point at CONTEXT.md.
 *
 * Usage:  node scripts/maintenance/check-prompts.mjs
 *         pnpm check:prompts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Every tool config that must encode the foces-webv23 off-limits rule
// (AGENTS.md lists them; this check keeps the list honest).
export const STUDIO_EXCLUSION_FILES = [
  'eslint.config.js',
  '.prettierignore',
  'knip.json',
  '.github/dependabot.yml',
  '.coderabbit.yaml',
  'lint-staged.config.js',
];
export const STUDIO_TOKEN = 'foces-webv23';

// 1. Exactly one active CodeRabbit config.
export function checkSingleCoderabbitConfig(exists) {
  const findings = [];
  if (!exists('.coderabbit.yaml')) {
    findings.push('missing root .coderabbit.yaml (the only active CodeRabbit config)');
  }
  if (exists('.github/coderabbit.yaml')) {
    findings.push(
      'legacy .github/coderabbit.yaml exists alongside root .coderabbit.yaml — ' +
        'the two disagree (early_access, path_filters, pre_merge_checks), so delete ' +
        'the legacy file and keep the root one as the single owner',
    );
  }
  return findings;
}

// 2. No stale "through ADR-XXXX" range pin in CLAUDE.md.
export function maxAdrNumber(adrFileNames) {
  let max = 0;
  for (const name of adrFileNames) {
    const m = name.match(/^(\d{4})-.*\.md$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function checkAdrPointerFresh(claudeText, maxAdr) {
  const m = claudeText.match(/through\s+ADR-(\d+)/i);
  if (m && Number(m[1]) !== maxAdr) {
    return [
      `CLAUDE.md pins the ADR range through ADR-${m[1]} but docs/adr/ indexes ` +
        `through ADR-${String(maxAdr).padStart(4, '0')} — drop the number and ` +
        `point at the docs/adr/ index instead`,
    ];
  }
  return [];
}

// 3. The studio exclusion survived in every tool config.
export function checkStudioExclusions(readFile) {
  const findings = [];
  for (const file of STUDIO_EXCLUSION_FILES) {
    const text = readFile(file);
    if (text === null) {
      findings.push(`missing ${file} (expected to encode the foces-webv23 exclusion)`);
    } else if (!text.includes(STUDIO_TOKEN)) {
      findings.push(`${file} no longer mentions ${STUDIO_TOKEN} — the studio exclusion drifted`);
    }
  }
  return findings;
}

// 4. Paths named in AGENTS.md resolve to real files.
const PATH_TOKEN = /`((?:src|docs|scripts|tests|public)\/[^`\s]*?)`/g;

export function extractDocPaths(markdown) {
  const out = [];
  let m;
  while ((m = PATH_TOKEN.exec(markdown)) !== null) {
    const p = m[1].replace(/[.,;:!?]+$/, '');
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

export function checkDocPaths(markdown, exists, listDir) {
  const findings = [];
  for (const p of extractDocPaths(markdown)) {
    if (p.includes('*')) {
      // Glob token (e.g. tests/*.spec.js): the parent dir must exist and
      // hold at least one match — otherwise the Map points at a ghost.
      const dir = path.posix.dirname(p);
      const re = new RegExp(
        `^${path.posix
          .basename(p)
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '[^/]*')}$`,
      );
      const entries = listDir(dir);
      if (entries === null) {
        findings.push(`AGENTS.md names ${p}, but ${dir}/ does not exist`);
      } else if (!entries.some((e) => re.test(e))) {
        findings.push(`AGENTS.md names ${p}, which matches nothing — update the Map, not the tree`);
      }
    } else if (!exists(p)) {
      findings.push(`AGENTS.md names ${p}, which does not exist — update the Map, not the tree`);
    }
  }
  return findings;
}

// 5. One glossary: the UBIQUITOUS_LANGUAGE.md fork was merged into
// CONTEXT.md and must not be reintroduced.
export function checkGlossarySingular(exists, claudeText) {
  const findings = [];
  if (exists('UBIQUITOUS_LANGUAGE.md')) {
    findings.push(
      'UBIQUITOUS_LANGUAGE.md exists — it was merged into CONTEXT.md ' +
        '(aliases, relationships, dialogue, ambiguities); delete it so terms cannot fork',
    );
  }
  if (!claudeText.includes('CONTEXT.md')) {
    findings.push('CLAUDE.md no longer points at CONTEXT.md as the single canonical glossary');
  }
  return findings;
}

export function runAllChecks({ exists, readFile, adrFileNames, listDir }) {
  const agentsMd = readFile('AGENTS.md') ?? '';
  const claudeMd = readFile('CLAUDE.md') ?? '';
  return [
    ...checkSingleCoderabbitConfig(exists),
    ...checkAdrPointerFresh(claudeMd, maxAdrNumber(adrFileNames)),
    ...checkStudioExclusions(readFile),
    ...checkDocPaths(agentsMd, exists, listDir),
    ...checkGlossarySingular(exists, claudeMd),
  ];
}

function main() {
  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  const readFile = (rel) => {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  };
  const listDir = (rel) => {
    const abs = path.join(ROOT, rel);
    return fs.existsSync(abs) ? fs.readdirSync(abs) : null;
  };
  const adrDir = path.join(ROOT, 'docs', 'adr');
  const adrFileNames = fs.existsSync(adrDir) ? fs.readdirSync(adrDir) : [];

  const findings = runAllChecks({ exists, readFile, adrFileNames, listDir });
  if (findings.length === 0) {
    console.log(
      '✓ check-prompts: agent-instruction layer is consistent (configs, ADR pointer, exclusions, Map paths, glossary).',
    );
    return;
  }
  console.error(`✗ Prompt-parity findings (${findings.length}):`);
  for (const f of findings) console.error(`  - ${f}`);
  process.exit(1);
}

// Run only when invoked directly — not when imported by the unit spec.
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
