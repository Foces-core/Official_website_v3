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
 * - This script downloads the PINNED release binary on first use, caches
 *   it under `node_modules/.cache/actionlint/` (gitignored), and reuses it
 *   afterwards. The version pin makes results reproducible across machines.
 * - If the download fails (offline, proxy, GH outage) the script prints a
 *   warning and exits 0 — a network hiccup must never block a push. Real
 *   actionlint findings still exit non-zero.
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

const VERSION = '1.7.12';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'actionlint');
const BIN_NAME = process.platform === 'win32' ? 'actionlint.exe' : 'actionlint';

// GitHub release asset names per platform. actionlint publishes
// `_windows_amd64.zip` and `_{linux,darwin}_{amd64,arm64}.tar.gz`.
function assetName() {
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  switch (process.platform) {
    case 'win32':
      return `actionlint_${VERSION}_windows_${arch}.zip`;
    case 'darwin':
      return `actionlint_${VERSION}_darwin_${arch}.tar.gz`;
    default:
      return `actionlint_${VERSION}_linux_${arch}.tar.gz`;
  }
}

async function download(url, dest) {
  console.log(`[actionlint] downloading ${url.split('/').pop()} (first run only)`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('fs');
  writeFileSync(dest, buf);
  return dest;
}

function extract(archive, dir) {
  mkdirSync(dir, { recursive: true });
  const binPath = path.join(dir, BIN_NAME);
  if (existsSync(binPath)) return binPath;

  if (archive.endsWith('.zip')) {
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
  } else {
    // tar.gz — tar exists on macOS, Linux and Git Bash on Windows.
    const r = spawnSync('tar', ['-xzf', archive, '-C', dir], { stdio: 'pipe' });
    if (r.status !== 0) throw new Error(`extract failed: ${r.stderr}`);
  }
  return binPath;
}

function findBinary() {
  const candidates = [path.join(CACHE_DIR, BIN_NAME), path.join(CACHE_DIR, VERSION, BIN_NAME)];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

// --- main ---------------------------------------------------------------

async function main() {
  const existing = findBinary();
  let bin = existing;

  if (!bin) {
    try {
      const asset = assetName();
      const archive = path.join(CACHE_DIR, asset);
      mkdirSync(CACHE_DIR, { recursive: true });
      await download(
        `https://github.com/rhysd/actionlint/releases/download/v${VERSION}/${asset}`,
        archive,
      );
      bin = extract(archive, path.join(CACHE_DIR, VERSION));
      chmodSync(bin, 0o755);
      // Drop the archive + any stale version dirs to keep the cache tidy.
      rmSync(archive, { force: true });
      for (const entry of readdirSync(CACHE_DIR)) {
        if (entry !== VERSION)
          rmSync(path.join(CACHE_DIR, entry), { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[actionlint] could not fetch binary (${err.message}); skipping check.`);
      console.warn('[actionlint] run `pnpm lint:workflows` later to re-check.');
      // Graceful skip: set the code, don't hard-exit — process.exit(0) while
      // the failed fetch still holds resources crashes Node on Windows (libuv
      // assertion in async.c). A network hiccup must never block a push.
      process.exitCode = 0;
      return;
    }
  }

  // No positional args: actionlint's default scan covers `.github/workflows`
  // and `.github/actions`. (Passing the dir as an argument breaks on Windows
  // when the repo path contains spaces — default scan avoids that entirely.)
  const r = spawnSync(bin, [], { stdio: 'inherit', cwd: ROOT });
  process.exitCode = r.status ?? 1;
}

main();
