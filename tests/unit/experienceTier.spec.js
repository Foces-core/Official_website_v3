import { describe, it, expect } from 'vitest';
import {
  EXPERIENCE_TIERS,
  resolveExperienceTier,
  resolveExperienceCapabilities,
} from '../../src/utils/experienceTier.js';

// The full truth table: every combination of the three degradation signals,
// and the tier + capabilities each yields. This spec replaces reasoning
// across the ~12 call sites that used to re-derive these dialects themselves.
const TRUTH_TABLE = [
  // slowNetwork lowCPU reducedMotion -> tier, fullOnly, grain, netGates, motionGates, imageMaxWidth
  [false, false, false, 'full', true, true, true, true, 1000],
  [false, false, true, 'lite', false, true, true, false, 1000],
  [false, true, false, 'lite', false, false, true, true, 800],
  [false, true, true, 'lite', false, false, true, false, 800],
  [true, false, false, 'minimal', false, false, false, true, 400],
  [true, false, true, 'minimal', false, false, false, false, 400],
  [true, true, false, 'minimal', false, false, false, true, 400],
  [true, true, true, 'minimal', false, false, false, false, 400],
];

const FULL_ONLY = [
  'webgl',
  'autoplay',
  'cube3d',
  'idleSpin',
  'confetti',
  'aosReveals',
  'skeletonMotion',
];
const NET_GATES = ['prefetch', 'splash', 'scrollGate'];
const MOTION_GATES = ['celebrationMotion', 'smoothScroll'];

describe('resolveExperienceTier — the tier matrix', () => {
  it.each(TRUTH_TABLE)(
    'slowNetwork=%s lowCPU=%s reducedMotion=%s → %s',
    (slowNetwork, lowCPU, reducedMotion, tier) => {
      expect(resolveExperienceTier({ slowNetwork, lowCPU, reducedMotion })).toBe(tier);
    },
  );

  it('defaults every signal off (capable device → full)', () => {
    expect(resolveExperienceTier()).toBe(EXPERIENCE_TIERS.FULL);
    expect(resolveExperienceTier({})).toBe(EXPERIENCE_TIERS.FULL);
  });

  it('exposes the tier constants the matrix returns', () => {
    expect(Object.values(EXPERIENCE_TIERS)).toEqual(['full', 'lite', 'minimal']);
  });
});

describe('resolveExperienceCapabilities — the capability matrix', () => {
  it.each(TRUTH_TABLE)(
    'slowNetwork=%s lowCPU=%s reducedMotion=%s',
    (
      slowNetwork,
      lowCPU,
      reducedMotion,
      tier,
      fullOnly,
      grain,
      netGates,
      motionGates,
      imageMaxWidth,
    ) => {
      const caps = resolveExperienceCapabilities({ slowNetwork, lowCPU, reducedMotion });
      expect(caps.tier).toBe(tier);
      for (const name of FULL_ONLY) {
        expect(caps[name], `${name} on ${tier}`).toBe(fullOnly);
      }
      expect(caps.grain, `grain on ${tier}`).toBe(grain);
      for (const name of NET_GATES) {
        expect(caps[name], `${name} on ${tier}`).toBe(netGates);
      }
      for (const name of MOTION_GATES) {
        expect(caps[name], `${name} on ${tier}`).toBe(motionGates);
      }
      expect(caps.imageMaxWidth).toBe(imageMaxWidth);
    },
  );

  it('grain survives on reduced-motion devices (static texture is not a motion gate)', () => {
    const caps = resolveExperienceCapabilities({ reducedMotion: true });
    expect(caps.tier).toBe('lite');
    expect(caps.grain).toBe(true);
  });

  it('prefetch/splash/scrollGate survive on low-CPU devices (only slow network strips them)', () => {
    const caps = resolveExperienceCapabilities({ lowCPU: true });
    expect(caps.tier).toBe('lite');
    expect(caps.prefetch).toBe(true);
    expect(caps.splash).toBe(true);
    expect(caps.scrollGate).toBe(true);
  });

  it('is a pure function of the profile (same input, same capabilities)', () => {
    const profile = { slowNetwork: true, lowCPU: false, reducedMotion: true };
    expect(resolveExperienceCapabilities(profile)).toEqual(resolveExperienceCapabilities(profile));
  });
});
