import { describe, it, expect, vi } from 'vitest';
import { isActivationKey, onActivationKey } from '../../src/utils/ariaActivation.js';

describe('isActivationKey', () => {
  it('returns true for Enter', () => {
    expect(isActivationKey({ key: 'Enter' })).toBe(true);
  });

  it('returns true for Space (" ") and legacy "Spacebar"', () => {
    expect(isActivationKey({ key: ' ' })).toBe(true);
    expect(isActivationKey({ key: 'Spacebar' })).toBe(true);
  });

  it('returns false for other keys', () => {
    expect(isActivationKey({ key: 'Tab' })).toBe(false);
    expect(isActivationKey({ key: 'Escape' })).toBe(false);
    expect(isActivationKey({ key: 'ArrowDown' })).toBe(false);
    expect(isActivationKey({ key: 'a' })).toBe(false);
  });

  it('returns false for invalid or missing inputs', () => {
    expect(isActivationKey(null)).toBe(false);
    expect(isActivationKey(undefined)).toBe(false);
    expect(isActivationKey({})).toBe(false);
    expect(isActivationKey({ key: 123 })).toBe(false);
  });
});

describe('onActivationKey', () => {
  it('calls preventDefault and executes callback on Enter', () => {
    const onActivate = vi.fn();
    const preventDefault = vi.fn();
    const handler = onActivationKey(onActivate);

    handler({ key: 'Enter', preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('calls preventDefault and executes callback on Space', () => {
    const onActivate = vi.fn();
    const preventDefault = vi.fn();
    const handler = onActivationKey(onActivate);

    handler({ key: ' ', preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys without calling callback or preventDefault', () => {
    const onActivate = vi.fn();
    const preventDefault = vi.fn();
    const handler = onActivationKey(onActivate);

    handler({ key: 'ArrowRight', preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('tolerates events without preventDefault function', () => {
    const onActivate = vi.fn();
    const handler = onActivationKey(onActivate);

    expect(() => handler({ key: 'Enter' })).not.toThrow();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
