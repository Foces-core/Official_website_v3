import { describe, it, expect } from 'vitest';
import { clearManualMotion, setManualMotion } from '../../src/utils/manualMotion.js';

describe('manualMotion', () => {
  it('opts a manual transform transition into the reduced-motion exception', () => {
    const el = document.createElement('div');
    setManualMotion(el, 400, 'ease-out');

    expect(el.getAttribute('data-manual-motion')).toBe('true');
    expect(el.style.getPropertyValue('--manual-motion-duration')).toBe('400ms');
    expect(el.style.getPropertyValue('--manual-motion-timing')).toBe('ease-out');
    expect(el.style.transition).toBe('transform 400ms ease-out');
  });

  it('keeps automatic or zero-length moves out of the exception', () => {
    const el = document.createElement('div');
    el.setAttribute('data-manual-motion', 'true');
    setManualMotion(el, 420, 'linear', false);
    expect(el.hasAttribute('data-manual-motion')).toBe(false);
    expect(el.style.transition).toBe('transform 420ms linear');

    el.setAttribute('data-manual-motion', 'true');
    setManualMotion(el, 0, 'linear');
    expect(el.hasAttribute('data-manual-motion')).toBe(false);
  });

  it('clears the opt-in and its timing properties', () => {
    const el = document.createElement('div');
    setManualMotion(el, 400, 'ease-out');
    clearManualMotion(el);

    expect(el.hasAttribute('data-manual-motion')).toBe(false);
    expect(el.style.getPropertyValue('--manual-motion-duration')).toBe('');
    expect(el.style.getPropertyValue('--manual-motion-timing')).toBe('');
    expect(el.style.transition).toBe('transform 400ms ease-out');
  });

  it('ignores a missing element', () => {
    expect(() => clearManualMotion(null)).not.toThrow();
  });
});
