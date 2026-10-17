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
    expect(track.style.alignItems).toBe('center');
    expect(track.style.columnGap).toBe('20px');
    expect(track.style.transformStyle).toBe('');
    expect(track.style.height).toBe('');
    expect(root.style.perspective).toBe('');
    expect(track.children[0].style.position).toBe('');
    expect(track.children[0].style.inset).toBe('');
    expect(track.children[0].style.width).toBe('');
    expect(track.children[0].style.height).toBe('');
    expect(track.children[0].style.backfaceVisibility).toBe('');
    expect(track.children[0].style.flex).toContain('calc');
  });

  it('cubeAdapter styleTrack sets preserve-3d', () => {
    const track = document.createElement('div');
    const root = document.createElement('div');
    track.appendChild(document.createElement('div'));
    cubeAdapter.styleTrack(track, root);
    expect(root.style.perspective).toBe('1200px');
    expect(track.style.display).toBe('');
    expect(track.style.columnGap).toBe('');
    expect(track.style.transformStyle).toBe('preserve-3d');
    expect(track.children[0].style.position).toBe('absolute');
    expect(track.children[0].style.inset).toBe('0px');
    expect(track.children[0].style.width).toBe('100%');
    expect(track.children[0].style.height).toBe('100%');
    expect(track.children[0].style.backfaceVisibility).toBe('hidden');
    expect(track.children[0].style.flex).toBe('');
  });

  it('flatAdapter measures only visible, sized slides and includes the gap in its step', () => {
    const track = document.createElement('div');
    expect(flatAdapter.measure(track, 20)).toBeNull();

    const slide = document.createElement('div');
    track.appendChild(slide);
    expect(flatAdapter.measure(track, 20)).toBeNull();

    Object.defineProperty(slide, 'offsetParent', { configurable: true, value: {} });
    slide.getBoundingClientRect = () => ({ width: 200 });
    expect(flatAdapter.measure(track, 20)).toEqual({ slideWidth: 200, step: 220 });

    slide.getBoundingClientRect = () => ({ width: 0 });
    expect(flatAdapter.measure(track, 20)).toBeNull();
  });

  it('cubeAdapter measures from track then root width and sets height only when available', () => {
    const track = document.createElement('div');
    const root = document.createElement('div');
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 300 });
    const wrapper = document.createElement('div');
    const card = document.createElement('div');
    Object.defineProperty(card, 'offsetHeight', { configurable: true, value: 120 });
    wrapper.appendChild(card);
    track.appendChild(wrapper);

    expect(cubeAdapter.measure(track, root)).toEqual({ faceWidth: 300 });
    expect(track.style.height).toBe('120px');

    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 0 });
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: 240 });
    Object.defineProperty(card, 'offsetHeight', { configurable: true, value: 0 });
    expect(cubeAdapter.measure(track, root)).toEqual({ faceWidth: 240 });
    expect(track.style.height).toBe('120px');
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: 0 });
    expect(cubeAdapter.measure(track, root)).toBeNull();
  });

  it('flatAdapter getTransform delegates', () => {
    const t = flatAdapter.getTransform(2, 100, 10);
    expect(t).toContain('translate3d');
  });

  it('cubeAdapter getTransform delegates', () => {
    const t = cubeAdapter.getTransform(1, 100, 5);
    expect(t).toContain('rotateY');
  });

  it('cubeAdapter computes each face transform from its index and radius', () => {
    expect(cubeAdapter.getFaceTransform(2, 150)).toContain('rotateY(180deg)');
    expect(cubeAdapter.getFaceTransform(2, 150)).toContain('translateZ(150px)');
  });
});
