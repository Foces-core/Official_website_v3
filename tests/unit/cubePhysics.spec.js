import { describe, it, expect } from 'vitest';
import {
  CUBE_PHYSICS,
  DEG_PER_FRAME,
  snapAngle,
  windStepVelocity,
  isWindStopped,
  resolveWindDown,
  splitSpins,
  emaVelocity,
} from '../../src/utils/cubePhysics.js';

describe('DEG_PER_FRAME', () => {
  it('converts deg/ms to deg/frame at 60fps', () => {
    expect(DEG_PER_FRAME).toBeCloseTo(16.667, 2);
  });
});

describe('snapAngle', () => {
  it('rounds to nearest 90°', () => {
    expect(snapAngle(0)).toBe(0);
    expect(snapAngle(45)).toBe(90);
    expect(snapAngle(89)).toBe(90);
    expect(snapAngle(-10)).toBe(0);
    expect(snapAngle(180)).toBe(180);
  });
});

describe('splitSpins', () => {
  it('yields 0 spins below threshold', () => {
    expect(splitSpins(50)).toEqual({ spins: 0, remainder: 50 });
  });
  it('yields 1 spin at threshold', () => {
    expect(splitSpins(90)).toEqual({ spins: 1, remainder: 0 });
  });
  it('yields multiple spins', () => {
    expect(splitSpins(270)).toEqual({ spins: 3, remainder: 0 });
  });
  it('yields spins with remainder', () => {
    expect(splitSpins(135)).toEqual({ spins: 1, remainder: 45 });
  });
});

describe('windStepVelocity', () => {
  it('decays by friction', () => {
    expect(windStepVelocity(10, 0.9)).toBeCloseTo(9);
  });
});

describe('isWindStopped', () => {
  it('true below minSpeed', () => {
    expect(isWindStopped(0.01)).toBe(true);
  });
  it('false above minSpeed', () => {
    expect(isWindStopped(1)).toBe(false);
  });
});

describe('resolveWindDown', () => {
  it('returns null for very slow release', () => {
    expect(resolveWindDown(0.001)).toBeNull();
  });
  it('returns normal params for moderate release', () => {
    const r = resolveWindDown(0.1);
    expect(r).not.toBeNull();
    expect(r.rapid).toBe(false);
    expect(r.friction).toBe(CUBE_PHYSICS.normalWindFriction);
  });
  it('returns rapid params for fast release', () => {
    const r = resolveWindDown(0.5);
    expect(r.rapid).toBe(true);
    expect(r.friction).toBe(CUBE_PHYSICS.rapidWindFriction);
  });
  it('caps extreme release at rapid max', () => {
    expect(resolveWindDown(0.72)).toEqual({
      velocity: CUBE_PHYSICS.rapidMaxWindSpeed,
      friction: CUBE_PHYSICS.rapidWindFriction,
      rapid: true,
    });
  });
});

describe('emaVelocity', () => {
  it('mixes prev with instantaneous rate', () => {
    expect(emaVelocity(10, 100, 1)).toBeCloseTo(46);
  });
  it('decays to zero without movement', () => {
    let v = 10;
    for (let i = 0; i < 20; i += 1) v = emaVelocity(v, 0, 1);
    expect(v).toBeCloseTo(0);
  });
  it('custom k and zero dt guard', () => {
    expect(emaVelocity(10, 50, 1, 1)).toBe(50);
    expect(emaVelocity(10, 0, 0)).toBe(6);
  });
});
