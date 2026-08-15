import { afterEach, describe, expect, it } from 'vitest';
// The wrapper reads process.platform/arch; importing the Node global
// explicitly keeps ESLint's browser-globals config happy in jsdom specs.
import process from 'node:process';
import {
  DownloadError,
  UnsupportedTargetError,
  alAssetName,
  scAssetName,
  SC_SHA256,
  classifyHttpError,
} from '../../scripts/maintenance/actionlint-check.mjs';

// The wrapper's failure policy (from #88/#90): HTTP status decides whether a
// download failure is transient (graceful skip locally) or permanent (hard
// failure). Retryable statuses — 408, 429, any 5xx — are DownloadError.
// 4xx client errors like 404 mean a permanent config bug (bad pinned
// version / asset mapping) and are plain Error → setup failure.
describe('classifyHttpError — transient vs permanent failure decision', () => {
  it('classifies 404 as a permanent error (not DownloadError)', () => {
    expect(classifyHttpError(404, 'u')).not.toBeInstanceOf(DownloadError);
  });

  it('classifies retryable statuses (408, 429, 5xx) as DownloadError', () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      expect(classifyHttpError(status, 'u')).toBeInstanceOf(DownloadError);
    }
  });

  it('classifies other 4xx (400, 403) as permanent errors', () => {
    for (const status of [400, 403]) {
      expect(classifyHttpError(status, 'u')).not.toBeInstanceOf(DownloadError);
    }
  });

  it('embeds the URL in the message for debuggability', () => {
    const err = classifyHttpError(404, 'https://example.com/asset.zip');
    expect(err.message).toContain('https://example.com/asset.zip');
  });
});

// Target mapping: the wrapper must map each supported platform/arch to its
// exact release asset and reject unsupported ones loudly (never collapse
// ia32/arm/freebsd into amd64 — that was CodeRabbit finding #1 on #81).
describe('alAssetName — actionlint release asset per platform/arch', () => {
  const realPlatform = process.platform;
  const realArch = process.arch;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: realPlatform });
    Object.defineProperty(process, 'arch', { value: realArch });
  });

  function setTarget(platform, arch) {
    Object.defineProperty(process, 'platform', { value: platform });
    Object.defineProperty(process, 'arch', { value: arch });
  }

  it('maps supported targets to exact asset names', () => {
    setTarget('linux', 'x64');
    expect(alAssetName()).toBe('actionlint_1.7.12_linux_amd64.tar.gz');
    setTarget('linux', 'arm64');
    expect(alAssetName()).toBe('actionlint_1.7.12_linux_arm64.tar.gz');
    setTarget('darwin', 'x64');
    expect(alAssetName()).toBe('actionlint_1.7.12_darwin_amd64.tar.gz');
    setTarget('darwin', 'arm64');
    expect(alAssetName()).toBe('actionlint_1.7.12_darwin_arm64.tar.gz');
    setTarget('win32', 'x64');
    expect(alAssetName()).toBe('actionlint_1.7.12_windows_amd64.zip');
    setTarget('win32', 'arm64');
    expect(alAssetName()).toBe('actionlint_1.7.12_windows_arm64.zip');
  });

  it.each([
    ['ia32', 'x64'], // i386 must not silently become amd64
    ['arm', 'x64'],
    ['riscv64', 'x64'],
  ])('rejects unsupported arch (%s, %s)', (arch, platform) => {
    setTarget(platform, arch);
    expect(() => alAssetName()).toThrow(UnsupportedTargetError);
  });

  it.each([
    ['freebsd', 'x64'],
    ['openbsd', 'x64'],
  ])('rejects unsupported platform (%s, %s)', (platform, arch) => {
    setTarget(platform, arch);
    expect(() => alAssetName()).toThrow(UnsupportedTargetError);
  });
});

describe('scAssetName — shellcheck release asset per platform/arch', () => {
  const realPlatform = process.platform;
  const realArch = process.arch;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: realPlatform });
    Object.defineProperty(process, 'arch', { value: realArch });
  });

  function setTarget(platform, arch) {
    Object.defineProperty(process, 'platform', { value: platform });
    Object.defineProperty(process, 'arch', { value: arch });
  }

  it('maps supported targets to exact asset names', () => {
    setTarget('linux', 'x64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.linux.x86_64.tar.xz');
    setTarget('linux', 'arm64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.linux.aarch64.tar.xz');
    setTarget('darwin', 'x64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.darwin.x86_64.tar.xz');
    setTarget('darwin', 'arm64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.darwin.aarch64.tar.xz');
    // The single Windows zip covers both arches (runs under emulation).
    setTarget('win32', 'x64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.zip');
    setTarget('win32', 'arm64');
    expect(scAssetName()).toBe('shellcheck-v0.11.0.zip');
  });

  it.each([
    ['ia32', 'x64'],
    ['arm', 'x64'],
  ])('rejects unsupported arch (%s, %s)', (arch, platform) => {
    setTarget(platform, arch);
    expect(() => scAssetName()).toThrow(UnsupportedTargetError);
  });

  it.each([
    ['freebsd', 'x64'],
    ['openbsd', 'x64'],
  ])('rejects unsupported platform (%s, %s)', (platform, arch) => {
    setTarget(platform, arch);
    expect(() => scAssetName()).toThrow(UnsupportedTargetError);
  });
});

// The pinned shellcheck digests (from the v0.11.0 release notes) must cover
// every asset the wrapper can request, so a digest lookup can never silently
// miss on a supported platform.
describe('SC_SHA256 — pinned shellcheck digests cover all supported assets', () => {
  it('covers every asset produced by scAssetName on supported targets', () => {
    const targets = [
      ['win32', 'x64'],
      ['linux', 'x64'],
      ['linux', 'arm64'],
      ['darwin', 'x64'],
      ['darwin', 'arm64'],
    ];
    const realPlatform = process.platform;
    const realArch = process.arch;
    try {
      for (const [platform, arch] of targets) {
        Object.defineProperty(process, 'platform', { value: platform });
        Object.defineProperty(process, 'arch', { value: arch });
        const asset = scAssetName();
        expect(SC_SHA256).toHaveProperty(asset);
      }
    } finally {
      Object.defineProperty(process, 'platform', { value: realPlatform });
      Object.defineProperty(process, 'arch', { value: realArch });
    }
  });

  it('stores well-formed sha256 digests (64 hex chars)', () => {
    for (const digest of Object.values(SC_SHA256)) {
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
