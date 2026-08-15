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
 *   them under `node_modules/.cache/{actionlint,shellcheck}/<version>/`
 *   (gitignored), and reuses them afterwards. Version pins make results
 *   reproducible; the version-scoped cache dirs make a stale binary from a
 *   previous release impossible to pick up.
 * - Shellcheck (v0.11.0) is fetched alongside actionlint and handed to it
 *   via `-shellcheck=`, so the shell-injection checks (SC2xxx/SC3xxx rules
 *   on `run:` steps) run even where shellcheck isn't preinstalled
 *   (Windows/macOS). On GitHub Ubuntu runners shellcheck is pre-installed,
 *   which is why CI gets the same checks without the wrapper.
 * - The actionlint archive is verified against the SHA-256 in the release's
 *   `checksums.txt` before extraction (shellcheck publishes no checksums,
 *   so it relies on the pinned version + HTTPS alone).
 * - Failure policy, deliberately split:
 *   - Transient download failure (network, proxy, GH outage, timeout) →
 *     warn + exit 0. A network hiccup must never block a push.
 *   - Setup/extraction/checksum failure (corrupt archive, missing
 *     extractor, permission error) → error + exit 1. That means the tool
 *     cannot run for a non-transient reason, so failing silently would
 *     defeat the hook's purpose.
 *   - Unsupported platform/arch → error + exit 1 (fail loudly, don't
 *     silently download a wrong-arch binary).
 *   - Real actionlint findings → exit non-zero (via the final spawn).
 *
 * Usage:  node scripts/maintenance/actionlint-check.mjs
 *         pnpm lint:workflows
 *
 * Wired into `.husky/pre-push` so workflow bugs fail at push time instead
 * of after CI has already queued a run.
 */
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { chmodSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ACTIONLINT_VERSION = '1.7.12';
const SHELLCHECK_VERSION = '0.11.0';
const FETCH_TIMEOUT_MS = 30_000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_ROOT = path.join(ROOT, 'node_modules', '.cache');
const AL_CACHE_DIR = path.join(CACHE_ROOT, 'actionlint');
const SC_CACHE_DIR = path.join(CACHE_ROOT, 'shellcheck');

// Distinct error types so `main` can apply the failure policy above.
class DownloadError extends Error {}
class UnsupportedTargetError extends Error {}

// --- target mapping (per-tool exact asset names) -------------------------

const AL_BIN_NAME = process.platform === 'win32' ? 'actionlint.exe' : 'actionlint';
const SC_BIN_NAME = process.platform === 'win32' ? 'shellcheck.exe' : 'shellcheck';

// actionlint publishes `_linux_{amd64,arm64}.tar.gz`, `_darwin_{amd64,
// arm64}.tar.gz`, `_windows_amd64.zip` (+ a few exotic targets we don't
// ship for). Map the realistic dev platforms exactly; reject everything
// else instead of collapsing it into amd64.
function alAssetName() {
  let arch;
  switch (process.arch) {
    case 'x64':
      arch = 'amd64';
      break;
    case 'arm64':
      arch = 'arm64';
      break;
    default:
      throw new UnsupportedTargetError(
        `unsupported architecture for actionlint: ${process.arch} (expected x64 or arm64)`,
      );
  }
  switch (process.platform) {
    case 'win32':
      return `actionlint_${ACTIONLINT_VERSION}_windows_${arch}.zip`;
    case 'darwin':
      return `actionlint_${ACTIONLINT_VERSION}_darwin_${arch}.tar.gz`;
    case 'linux':
      return `actionlint_${ACTIONLINT_VERSION}_linux_${arch}.tar.gz`;
    default:
      throw new UnsupportedTargetError(
        `unsupported platform for actionlint: ${process.platform} (expected win32, darwin or linux)`,
      );
  }
}

// shellcheck publishes `shellcheck-v0.11.0.zip` (Windows, x86_64) and
// `shellcheck-v0.11.0.{linux,darwin}.{x86_64,aarch64}.tar.xz` (POSIX).
function scAssetName() {
  let arch;
  switch (process.arch) {
    case 'x64':
      arch = 'x86_64';
      break;
    case 'arm64':
      arch = 'aarch64';
      break;
    default:
      throw new UnsupportedTargetError(
        `unsupported architecture for shellcheck: ${process.arch} (expected x64 or arm64)`,
      );
  }
  switch (process.platform) {
    case 'win32':
      return `shellcheck-v${SHELLCHECK_VERSION}.zip`;
    case 'darwin':
      return `shellcheck-v${SHELLCHECK_VERSION}.darwin.${arch}.tar.xz`;
    case 'linux':
      return `shellcheck-v${SHELLCHECK_VERSION}.linux.${arch}.tar.xz`;
    default:
      throw new UnsupportedTargetError(
        `unsupported platform for shellcheck: ${process.platform} (expected win32, darwin or linux)`,
      );
  }
}

// --- shared download/verify/extract helpers -------------------------------

async function download(url, dest) {
  console.log(`[actionlint] downloading ${url.split('/').pop()} (first run only)`);
  let res;
  try {
    res = await fetch(url, {
      redirect: 'follow',
      // No default timeout in Node's fetch — a stalled request would hang
      // the pre-push hook forever. AbortSignal.timeout also aborts a
      // stalled res.arrayBuffer() below.
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    throw new DownloadError(`fetch failed: ${err.message}`);
  }
  if (!res.ok) throw new DownloadError(`HTTP ${res.status} from ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('fs');
  writeFileSync(dest, buf);
  return dest;
}

function extractZip(archive, dir) {
  // PowerShell Expand-Archive is guaranteed on Windows; unzip elsewhere.
  // Single quotes in the path are doubled (PowerShell escaping) and
  // -LiteralPath used so a path containing `'` or wildcards can't inject
  // into the -Command string.
  const r = spawnSync(
    process.platform === 'win32' ? 'powershell' : 'unzip',
    process.platform === 'win32'
      ? [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Force -LiteralPath '${archive.replace(/'/g, "''")}' -DestinationPath '${dir.replace(/'/g, "''")}'`,
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
  const existing = findBinary(cacheDir, binName);
  if (existing) return existing;

  const asset = assetName();
  const archive = path.join(cacheDir, asset);
  mkdirSync(cacheDir, { recursive: true });
  await download(binUrl(asset), archive);

  // Verify the actionlint archive against the release checksums file.
  if (asset.startsWith('actionlint_')) {
    const checksumsUrl = `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/actionlint_${ACTIONLINT_VERSION}_checksums.txt`;
    const res = await fetch(checksumsUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`could not fetch checksums (HTTP ${res.status})`);
    const lines = (await res.text()).split('\n');
    const entry = lines.find((l) => l.trimEnd().endsWith(`  ${asset}`));
    if (!entry) throw new Error(`no checksum entry for ${asset}`);
    const expected = entry.trim().split(/\s+/)[0];
    const { readFileSync } = await import('fs');
    const actual = createHash('sha256').update(readFileSync(archive)).digest('hex');
    if (actual !== expected) {
      rmSync(archive, { force: true });
      throw new Error(`checksum mismatch for ${asset} (expected ${expected}, got ${actual})`);
    }
  }

  if (isZip) {
    extractZip(archive, cacheDir);
  } else {
    extractTar(archive, cacheDir, tarFlags);
  }
  const bin = findBinary(cacheDir, binName);
  if (!bin) throw new Error(`binary not found after extracting ${asset}`);
  chmodSync(bin, 0o755);
  rmSync(archive, { force: true });
  return bin;
}

// Version-scoped cache lookup: `dir` may be `<cache>/<version>` (actionlint
// extracts at root of its version dir) or contain a nested versioned dir
// (POSIX shellcheck tarballs nest under `shellcheck-v<ver>/`), so search
// `dir` itself and one level deep.
function findBinary(cacheDir, binName) {
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
  // Resolve targets up front: an unsupported platform/arch must fail loudly
  // (exit 1), never be swallowed by the download-failure catch below.
  let alAsset;
  try {
    alAsset = alAssetName();
    scAssetName(); // also validates the shellcheck target
  } catch (err) {
    if (err instanceof UnsupportedTargetError) {
      console.error(`[actionlint] ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  // actionlint itself — transient download failures skip (exit 0), but
  // setup/extract/checksum failures fail (exit 1): the tool can't run for a
  // non-transient reason, and silently skipping would defeat the hook.
  let alBin = findBinary(path.join(AL_CACHE_DIR, ACTIONLINT_VERSION), AL_BIN_NAME);
  if (!alBin) {
    try {
      const cacheDir = path.join(AL_CACHE_DIR, ACTIONLINT_VERSION);
      alBin = await ensureTool({
        cacheDir,
        assetName: () => alAsset,
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
      if (err instanceof DownloadError) {
        console.warn(
          `[actionlint] could not download actionlint (${err.message}); skipping check.`,
        );
        console.warn('[actionlint] run `pnpm lint:workflows` later to re-check.');
        // Graceful skip: set the code, don't hard-exit — process.exit(0)
        // while the failed fetch still holds resources crashes Node on
        // Windows (libuv assertion in async.c).
        process.exitCode = 0;
        return;
      }
      console.error(
        `[actionlint] setup failed (${err.message}); not skipping — fix the environment issue.`,
      );
      process.exitCode = 1;
      return;
    }
  }

  // shellcheck — optional enhancement; degrade to core checks if it can't
  // be obtained for a transient reason.
  const args = [];
  try {
    const cacheDir = path.join(SC_CACHE_DIR, SHELLCHECK_VERSION);
    const scBin = await ensureTool({
      cacheDir,
      assetName: scAssetName,
      binName: SC_BIN_NAME,
      binUrl: (asset) =>
        `https://github.com/koalaman/shellcheck/releases/download/v${SHELLCHECK_VERSION}/${asset}`,
      isZip: process.platform === 'win32',
      tarFlags: 'J',
    });
    // Prune stale shellcheck version dirs, mirroring the actionlint cleanup.
    for (const entry of readdirSync(SC_CACHE_DIR)) {
      if (entry !== SHELLCHECK_VERSION)
        rmSync(path.join(SC_CACHE_DIR, entry), { recursive: true, force: true });
    }
    args.push(`-shellcheck=${scBin}`);
  } catch (err) {
    console.warn(
      `[actionlint] could not obtain shellcheck (${err.message}); shell-injection checks disabled for this run.`,
    );
  }

  // No positional args: actionlint's default scan validates workflow files
  // under `.github/workflows` plus the local action metadata those
  // workflows reference — it does not scan every file under
  // `.github/actions`. (Passing a dir as an argument breaks on Windows when
  // the repo path contains spaces — the default scan avoids that entirely.)
  const r = spawnSync(alBin, args, { stdio: 'inherit', cwd: ROOT });
  process.exitCode = r.status ?? 1;
}

main();
