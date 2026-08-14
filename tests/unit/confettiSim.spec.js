import { describe, it, expect, vi } from 'vitest';
import { createParticleSpec, stepParticle } from '../../src/Components/AboutUs/confettiSim.js';

// The seam is the pure particle physics behind the easter-egg confetti
// burst: the per-particle spec (initial velocities from a random source) and
// the per-frame step (gravity pulls down, drift damps, life decays). The DOM
// writes stay in AboutUs.jsx; the math is deterministic and testable here.

describe('createParticleSpec', () => {
  it('is deterministic for a given random source', () => {
    const rand = vi.fn().mockReturnValue(0.5);
    const spec = createParticleSpec(rand);
    expect(spec).toEqual({
      x: 0,
      y: 0,
      vx: 0,
      vy: -5, // -(2.5 + 0.5 * 5)
      rot: 180,
      vr: 0,
      life: 1,
      decay: 0.016, // 0.012 + 0.5 * 0.008
    });
  });

  it('spawns with upward velocity and a bounded decay', () => {
    const specs = Array.from({ length: 50 }, () => createParticleSpec());
    for (const s of specs) {
      expect(s.vy).toBeLessThanOrEqual(-2.5);
      expect(s.vy).toBeGreaterThanOrEqual(-7.5);
      expect(s.decay).toBeGreaterThanOrEqual(0.012);
      expect(s.decay).toBeLessThanOrEqual(0.02);
      expect(s.life).toBe(1);
    }
  });
});

describe('stepParticle', () => {
  it('applies gravity, drift, and rotation to the particle', () => {
    const p = { x: 10, y: 10, vx: 4, vy: -6, rot: 45, vr: 5, life: 1, decay: 0.01 };
    const alive = stepParticle(p);
    expect(alive).toBe(true);
    expect(p.vy).toBeCloseTo(-5.7524, 4); // (-6 + 0.16) * 0.985 — gravity lands before drift
    expect(p.vx).toBeCloseTo(3.94, 2);
    expect(p.y).toBeCloseTo(4.2476, 4);
    expect(p.x).toBeCloseTo(13.94, 2);
    expect(p.rot).toBe(50);
    expect(p.life).toBeCloseTo(0.99, 5);
  });

  it('returns false once life is exhausted (particle is done)', () => {
    const p = createParticleSpec();
    p.life = 0.005;
    const alive = stepParticle(p);
    expect(alive).toBe(false);
  });

  it('a burst of steps eventually kills every particle', () => {
    const p = createParticleSpec();
    let steps = 0;
    while (stepParticle(p)) {
      steps += 1;
      if (steps > 1000) break; // guard against infinite loops
    }
    expect(p.life).toBeLessThanOrEqual(0);
  });
});
