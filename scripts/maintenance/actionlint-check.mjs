#!/usr/bin/env node
/**
 * GitHub Actions workflow linter (actionlint) wrapper.
 *
 * Runs `actionlint` over `.github/workflows/*.yml` to catch workflow bugs
 * (bad YAML, unknown event triggers, shell-injection risk in `run:` steps,
 * malformed `on:` blocks) BEFORE they burn a CI run.
 *
 * Why a wrapper instead of a plain `actionlint` call:
 * - actionlint is a Go binary with no npm package, and requiring
 *   contributors to install Go/Docker just to push is a bad deal.
 * - This script downloads the PINNED release binaries on first use, caches
 *   them under `node_modules/.cache/{actionlint,shellcheck}/` (gitignored),
 *   and reuses them afterwards. Version pins make results reproducible.
 * - Shellcheck (v0.11.0) is fetched alongside actionlint and handed to it
 *   via `-shellcheck=`, so the shell-injection checks (SC2xxx/SC3xxx rules
 *   on `run:` steps) run even where shellcheck isn't preinstalled
 *   (Windows/macOS). On GitHub Ubuntu runners shellcheck is pre-installed,
 *   which is why CI gets the same checks without the wrapper.
 * - If either download fails (offline, proxy, GH outage) the script prints
 *   a warning and degrades gracefully: without shellcheck it still runs
 *   actionlint's core checks, and only if actionlint itself is unavailable
 *   does it skip (exit 0). A network hiccup must never block a push. Real
 *   findings still exit non-zero.
 *
 * Usage:  node scripts/maintenance/actionlint-check.mjs
 *         pnpm lint:workflows
 *
 * Wired into `.husky/pre-push` so workflow bugs fail at push time instead
 * of after CI has already queued a run.
 */
import { spawnSync } from 'child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ACTIONLINT_VERSION = '1.7.12';
const SHELLCHECK_VERSION = '0.11.0';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_ROOT = path.join(ROOT, 'node_modules', '.cache');
const AL_CACHE_DIR = path.join(CACHE_ROOT, 'actionlint');
const SC_CACHE_DIR = path.join(CACHE_ROOT, 'shellcheck');

// --- actionlint ----------------------------------------------------------

const AL_BIN_NAME = process.platform === 'win32' ? 'actionlint.exe' : 'actionlint';

// GitHub release asset names per platform. actionlint publishes
// `_windows_amd64.zip` and `_{linux,darwin}_{amd64,arm64}.tar.gz`.
function alAssetName() {
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  switch (process.platform) {
    case 'win32':
      return `actionlint_${ACTIONLINT_VERSION}_windows_${arch}.zip`;
    case 'darwin':
      return `actionlint_${ACTIONLINT_VERSION}_darwin_${arch}.tar.gz`;
    default:
      return `actionlint_${ACTIONLINT_VERSION}_linux_${arch}.tar.gz`;
  }
}

function alFindBinary() {
  const candidates = [
    path.join(AL_CACHE_DIR, AL_BIN_NAME),
    path.join(AL_CACHE_DIR, ACTIONLINT_VERSION, AL_BIN_NAME),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

// --- shellcheck ----------------------------------------------------------

const SC_BIN_NAME = process.platform === 'win32' ? 'shellcheck.exe' : 'shellcheck';

// shellcheck publishes `shellcheck-v0.11.0.zip` (Windows) and
// `shellcheck-v0.11.0.{linux,darwin}.{x86_64,aarch64}.tar.xz` (POSIX).
function scAssetName() {
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
  switch (process.platform) {
    case 'win32':
      return `shellcheck-v${SHELLCHECK_VERSION}.zip`;
    case 'darwin':
      return `shellcheck-v${SHELLCHECK_VERSION}.darwin.${arch}.tar.xz`;
    default:
      return `shellcheck-v${SHELLCHECK_VERSION}.linux.${arch}.tar.xz`;
  }
}

// --- shared download/extract helpers --------------------------------------

async function download(url, dest) {
  console.log(`[actionlint] downloading ${url.split('/').pop()} (first run only)`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('fs');
  writeFileSync(dest, buf);
  return dest;
}

function extractZip(archive, dir) {
  // PowerShell Expand-Archive is guaranteed on Windows; unzip elsewhere.
  const r = spawnSync(
    process.platform === 'win32' ? 'powershell' : 'unzip',
    process.platform === 'win32'
      ? [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Force -Path '${archive}' -DestinationPath '${dir}'`,
        ]
      : ['-o', archive, '-d', dir],
    { stdio: 'pipe' },
  );
  if (r.status !== 0) throw new Error(`extract failed: ${r.stderr}`);
}

// `flags` is the GNU tar compression letter used after `-x` (`z` for gzip,
// `J` for xz). tar exists on macOS, Linux and Git Bash on Windows.
function extractTar(archive, dir, flags) {
  const r = spawnSync('tar', ['-x' + flags + 'f', archive, '-C', dir], { stdio: 'pipe' });
  if (r.status !== 0) throw new Error(`extract failed: ${r.stderr}`);
}

async function ensureTool({ cacheDir, assetName, binName, binUrl, isZip, tarFlags }) {
  const existing = scFindBinarySafe(cacheDir, binName);
  if (existing) return existing;

  const asset = assetName();
  const archive = path.join(cacheDir, asset);
  mkdirSync(cacheDir, { recursive: true });
  await download(binUrl(asset), archive);
  if (isZip) {
    extractZip(archive, cacheDir);
  } else {
    extractTar(archive, cacheDir, tarFlags);
  }
  const bin = scFindBinarySafe(cacheDir, binName);
  if (!bin) throw new Error(`binary not found after extracting ${asset}`);
  chmodSync(bin, 0o755);
  rmSync(archive, { force: true });
  return bin;
}

// Recursive-by-name search over a cache dir; `dir` may be the versioned
// subdir after extraction (POSIX tarballs nest), so look one level deep.
function scFindBinarySafe(cacheDir, binName) {
  const direct = path.join(cacheDir, binName);
  if (existsSync(direct)) return direct;
  if (!existsSync(cacheDir)) return null;
  for (const entry of readdirSync(cacheDir)) {
    const candidate = path.join(cacheDir, entry, binName);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// --- main ---------------------------------------------------------------

async function main() {
  // actionlint itself — if this can't be fetched, skip the whole check.
  let alBin = alFindBinary();
  if (!alBin) {
    try {
      const cacheDir = path.join(AL_CACHE_DIR, ACTIONLINT_VERSION);
      alBin = await ensureTool({
        cacheDir,
        assetName: alAssetName,
        binName: AL_BIN_NAME,
        binUrl: (asset) =>
          `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/${asset}`,
        isZip: process.platform === 'win32',
        tarFlags: 'z',
      });
      // Drop any stale version dirs to keep the cache tidy.
      for (const entry of readdirSync(AL_CACHE_DIR)) {
        if (entry !== ACTIONLINT_VERSION)
          rmSync(path.join(AL_CACHE_DIR, entry), { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[actionlint] could not fetch actionlint (${err.message}); skipping check.`);
      console.warn('[actionlint] run `pnpm lint:workflows` later to re-check.');
      // Graceful skip: set the code, don't hard-exit — process.exit(0) while
      // the failed fetch still holds resources crashes Node on Windows (libuv
      // assertion in async.c). A network hiccup must never block a push.
      process.exitCode = 0;
      return;
    }
  }

  // shellcheck — optional enhancement; degrade to core checks if unavailable.
  const args = [];
  try {
    const scBin = await ensureTool({
      cacheDir: SC_CACHE_DIR,
      assetName: scAssetName,
      binName: SC_BIN_NAME,
      binUrl: (asset) =>
        `https://github.com/koalaman/shellcheck/releases/download/v${SHELLCHECK_VERSION}/${asset}`,
      isZip: process.platform === 'win32',
      tarFlags: 'J',
    });
    args.push(`-shellcheck=${scBin}`);
  } catch (err) {
    console.warn(
      `[actionlint] could not fetch shellcheck (${err.message}); shell-injection checks disabled for this run.`,
    );
  }

  // No positional args: actionlint's default scan covers `.github/workflows`
  // and `.github/actions`. (Passing the dir as an argument breaks on Windows
  // when the repo path contains spaces — default scan avoids that entirely.)
  const r = spawnSync(alBin, args, { stdio: 'inherit', cwd: ROOT });
  process.exitCode = r.status ?? 1;
}

main();
