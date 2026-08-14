import { describe, it, expect } from 'vitest';
import {
  CUBE_PHYSICS,
  DEG_PER_FRAME,
  snapAngle,
  windStepVelocity,
  isWindStopped,
  resolveWindDown,
} from '../../src/Components/AboutUs/cubePhysics.js';

// The seam is the pure physics behind the About cube's wind-down: snap
// angles, per-frame friction decay, and the drag-release -> wind-down
// resolution that endDrag applies. These constants and formulas used to live
// inline in AboutUs.jsx, untested, where every tuning tweak risked the feel
// of the spin.

describe('DEG_PER_FRAME', () => {
  it('converts deg/ms drag velocity to deg/frame at 60fps', () => {
    expect(DEG_PER_FRAME).toBeCloseTo(16.667, 2);
  });
});

describe('snapAngle', () => {
  it('settles onto the nearest 90° face', () => {
    expect(snapAngle(0)).toBe(0);
    expect(snapAngle(90)).toBe(90);
    expect(snapAngle(100)).toBe(90);
    expect(snapAngle(135)).toBe(180);
    expect(snapAngle(-90)).toBe(-90);
    expect(snapAngle(-100)).toBe(-90);
  });
});

describe('windStepVelocity / isWindStopped', () => {
  it('decays the per-frame velocity by the friction', () => {
    expect(windStepVelocity(10, 0.92)).toBeCloseTo(9.2, 5);
    expect(windStepVelocity(9.2, 0.975)).toBeCloseTo(8.97, 2);
  });

  it('stops only below the minimum wind speed (snap boundary exclusive)', () => {
    expect(isWindStopped(0.04)).toBe(true);
    expect(isWindStopped(0.05)).toBe(false); // exactly at the floor keeps spinning
    expect(isWindStopped(-0.04)).toBe(true);
  });
});

describe('resolveWindDown', () => {
  it('returns null for a release too slow to wind down (caller snaps instead)', () => {
    // 0.001 deg/ms -> ~0.017 deg/frame, well under the 0.05 floor.
    expect(resolveWindDown(0.001)).toBeNull();
  });

  it('uses the normal friction and speed cap for a casual release', () => {
    // 0.12 deg/ms -> 2 deg/frame: below the rapid threshold, under the cap.
    expect(resolveWindDown(0.12)).toEqual({
      velocity: 2,
      friction: CUBE_PHYSICS.normalWindFriction,
      rapid: false,
    });
  });

  it('uses the rapid friction and cap for a fast release', () => {
    // 0.36 deg/ms -> 6 deg/frame: rapid, under the rapid cap.
    expect(resolveWindDown(0.36)).toEqual({
      velocity: 6,
      friction: CUBE_PHYSICS.rapidWindFriction,
      rapid: true,
    });
  });

  it('caps an extreme release at the rapid max speed', () => {
    // 0.72 deg/ms -> 12 deg/frame: capped at 9.
    expect(resolveWindDown(0.72)).toEqual({
      velocity: CUBE_PHYSICS.rapidMaxWindSpeed,
      friction: CUBE_PHYSICS.rapidWindFriction,
      rapid: true,
    });
  });
});
