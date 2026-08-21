import { describe, it, expect } from 'vitest';
import { flatAdapter, cubeAdapter, getAdapter } from '../../src/utils/carouselAdapters.js';

describe('carouselAdapters', () => {
  it('returns correct adapter via getAdapter', () => {
    expect(getAdapter('flat')).toBe(flatAdapter);
    expect(getAdapter('cube')).toBe(cubeAdapter);
    expect(getAdapter('unknown')).toBe(flatAdapter);
  });

  it('flatAdapter styleTrack sets flex basis', () => {
    const track = document.createElement('div');
    const root = document.createElement('div');
    track.appendChild(document.createElement('div'));
    track.appendChild(document.createElement('div'));
    flatAdapter.styleTrack(track, root, 2, 20);
    expect(track.style.display).toBe('flex');
    expect(track.children[0].style.flex).toContain('calc');
  });

  it('cubeAdapter styleTrack sets preserve-3d', () => {
    const track = document.createElement('div');
    const root = document.createElement('div');
    track.appendChild(document.createElement('div'));
    cubeAdapter.styleTrack(track, root);
    expect(root.style.perspective).toBe('1200px');
    expect(track.style.transformStyle).toBe('preserve-3d');
  });

  it('flatAdapter getTransform delegates', () => {
    const t = flatAdapter.getTransform(2, 100, 10);
    expect(t).toContain('translate3d');
  });

  it('cubeAdapter getTransform delegates', () => {
    const t = cubeAdapter.getTransform(1, 100, 5);
    expect(t).toContain('rotateY');
  });
});
