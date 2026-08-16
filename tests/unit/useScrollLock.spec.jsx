/* eslint-disable react/prop-types -- test fixture uses plain boolean prop */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHarness } from './harness.jsx';
import useScrollLock from '../../src/hooks/useScrollLock.js';

function ScrollLockComponent({ isLocked }) {
  useScrollLock(isLocked);
  return <div>Lock target</div>;
}

describe('useScrollLock hook', () => {
  let harness;

  beforeEach(() => {
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('locks body scroll when isLocked is true and unlocks when isLocked flips false', () => {
    harness.render(<ScrollLockComponent isLocked={false} />);
    expect(document.body.style.overflow).not.toBe('hidden');

    harness.render(<ScrollLockComponent isLocked={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    harness.render(<ScrollLockComponent isLocked={false} />);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('releases lock when component unmounts while locked', () => {
    harness.render(<ScrollLockComponent isLocked={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    harness.unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
