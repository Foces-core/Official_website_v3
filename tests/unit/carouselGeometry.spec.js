import { describe, it, expect } from 'vitest';
import {
  CUBE_ANGLE,
  slideStep,
  flatTrackTransform,
  cubeFaceTransform,
  cubeTrackTransform,
  cubeDragAngle,
  dragSnap,
  trackPosition,
  transitionPlan,
} from '../../src/utils/carouselGeometry.js';

describe('slideStep', () => {
  it('is slide width plus the gap', () => {
    expect(slideStep(300, 50)).toBe(350);
    expect(slideStep(0, 0)).toBe(0);
  });
});

describe('flatTrackTransform', () => {
  it('translates left by activeIndex * step', () => {
    expect(flatTrackTransform(0, 350)).toBe('translate3d(0px, 0, 0)');
    expect(flatTrackTransform(2, 350)).toBe('translate3d(-700px, 0, 0)');
  });

  it('previews a drag offset (dragging left adds a positive offset back)', () => {
    expect(flatTrackTransform(2, 350, 120)).toBe('translate3d(-580px, 0, 0)');
    expect(flatTrackTransform(2, 350, -120)).toBe('translate3d(-820px, 0, 0)');
  });
});

describe('cube transforms (match Swiper EffectCube orientation)', () => {
  it('CUBE_ANGLE is 90° per face', () => {
    expect(CUBE_ANGLE).toBe(90);
  });

  it('each face rotates by index * 90° and pushes out to the radius', () => {
    expect(cubeFaceTransform(0, 160)).toBe('rotateY(0deg) translateZ(160px)');
    expect(cubeFaceTransform(1, 160)).toBe('rotateY(90deg) translateZ(160px)');
    expect(cubeFaceTransform(3, 160)).toBe('rotateY(270deg) translateZ(160px)');
  });

  it('the track rotates -90° per active face', () => {
    expect(cubeTrackTransform(0)).toBe('rotateY(0deg)');
    expect(cubeTrackTransform(1)).toBe('rotateY(-90deg)');
    expect(cubeTrackTransform(4)).toBe('rotateY(-360deg)');
  });

  it('previews drag toward the NEXT face when dragging left (negative angle makes the rotation more negative — the direction dragSnap settles on)', () => {
    expect(cubeTrackTransform(2, -18)).toBe('rotateY(-198deg)');
    expect(cubeTrackTransform(4, -24)).toBe('rotateY(-384deg)');
  });

  it('previews drag toward the PREVIOUS face when dragging right', () => {
    expect(cubeTrackTransform(2, 18)).toBe('rotateY(-162deg)');
  });

  it('a full face width of drag equals one 90° turn', () => {
    expect(cubeDragAngle(160, 320)).toBe(45);
    expect(cubeDragAngle(-320, 320)).toBe(-90);
    expect(cubeDragAngle(50, 0)).toBe(0); // guard divide-by-zero
  });
});

describe('dragSnap', () => {
  it('dragging left past the threshold advances to next', () => {
    expect(dragSnap(-200, 350, 0)).toBe(1);
  });

  it('dragging right past the threshold goes to previous', () => {
    expect(dragSnap(200, 350, 0)).toBe(-1);
  });

  it('a short drag snaps back in place', () => {
    expect(dragSnap(-60, 350, 0)).toBe(0);
  });

  it('a fast flick overrides a short drag', () => {
    expect(dragSnap(-40, 350, -1.2)).toBe(1);
    expect(dragSnap(40, 350, 1.2)).toBe(-1);
  });

  it('a fast flick does NOT advance on a stationary tap (micro-jitter < 10px)', () => {
    // An 8px jitter 1ms after the last move reads 8px/ms — well over the
    // flick threshold — but must not turn a face the user meant as a tap.
    expect(dragSnap(-8, 350, -8)).toBe(0);
    expect(dragSnap(8, 350, 8)).toBe(0);
    // A genuine short flick still wins.
    expect(dragSnap(-12, 350, -8)).toBe(1);
  });

  it('uses the custom threshold ratio', () => {
    expect(dragSnap(-100, 350, 0, 0.25)).toBe(1); // 87.5 threshold
    expect(dragSnap(-80, 350, 0, 0.25)).toBe(0);
  });
});

describe('trackPosition', () => {
  const flat = { mode: 'flat', step: 350, total: 4, raw: 5 };
  const cube = { mode: 'cube', step: 0, total: 11, raw: 5 };

  it('falls back to the raw index without a rendered transform', () => {
    expect(trackPosition('', flat)).toBe(5);
    expect(trackPosition(undefined, flat)).toBe(5);
    expect(trackPosition('none', cube)).toBe(5);
  });

  it('reads flat offsets from translate strings and 2D/3D matrices', () => {
    expect(trackPosition('translate3d(-1575px, 0, 0)', flat)).toBe(4.5);
    expect(trackPosition('translateX(-1750px)', flat)).toBe(5);
    expect(trackPosition('matrix(1, 0, 0, 1, -1925, 0)', flat)).toBe(5.5);
    expect(
      trackPosition('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1575, 0, 0, 1)', flat),
    ).toBe(4.5);
  });

  it('maps a flat offset onto the copy nearest the raw index', () => {
    expect(trackPosition('translate3d(-175px, 0, 0)', flat)).toBe(4.5);
    expect(trackPosition('translate3d(-175px, 0, 0)', { ...flat, raw: 1 })).toBe(0.5);
  });

  it('falls back when the flat offset or step is unusable', () => {
    expect(trackPosition('scale(2)', flat)).toBe(5);
    expect(trackPosition('translate3d(-700px, 0, 0)', { ...flat, step: 0 })).toBe(5);
  });

  it('reads cube angles from rotateY strings', () => {
    expect(trackPosition('rotateY(-405deg)', cube)).toBe(4.5);
    expect(trackPosition('rotateY(-783deg)', { ...cube, raw: 8 })).toBeCloseTo(8.7);
  });

  it('maps a cube angle onto the 4-face turn nearest the raw index', () => {
    expect(trackPosition('rotateY(-45deg)', cube)).toBe(4.5);
    expect(trackPosition('rotateY(-45deg)', { ...cube, raw: 9 })).toBe(8.5);
  });

  it('reads cube angles from 3D matrices only', () => {
    const quarterTurn = 'matrix3d(0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1)';
    expect(trackPosition(quarterTurn, { ...cube, raw: 4 })).toBe(3);
    expect(trackPosition('matrix(1, 0, 0, 1, 0, 0)', cube)).toBe(5);
    expect(trackPosition('scale(2)', cube)).toBe(5);
  });
});

describe('transitionPlan', () => {
  it('eases a fresh move over the full speed', () => {
    expect(transitionPlan({ continuing: false, from: 0, to: 3, speed: 420 })).toEqual({
      duration: 420,
      timing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    });
  });

  it('continues an in-flight move linearly, scaled by the remaining distance', () => {
    expect(transitionPlan({ continuing: true, from: 4.5, to: 6, speed: 420 })).toEqual({
      duration: 630,
      timing: 'linear',
    });
    expect(transitionPlan({ continuing: true, from: 6.5, to: 6, speed: 420 }).duration).toBe(210);
    expect(transitionPlan({ continuing: true, from: 4.7, to: 5, speed: 420 }).duration).toBe(126);
  });
});
