/* eslint-disable react/prop-types -- test fixtures use plain props without full schemas */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHarness } from './harness.jsx';
import useRoutePrefetch from '../../src/hooks/useRoutePrefetch.js';
import * as routePrefetchLogic from '../../src/utils/routePrefetchLogic.js';

function TestPrefetchComponent({ slowNetwork, idleDelayMs }) {
  const { handlePrefetch } = useRoutePrefetch({ slowNetwork, idleDelayMs });
  return (
    <div>
      <button id="prefetch-events" onClick={() => handlePrefetch('events')}>
        Events
      </button>
      <button id="prefetch-contact" onClick={() => handlePrefetch('contact')}>
        Contact
      </button>
    </div>
  );
}

describe('useRoutePrefetch hook', () => {
  let harness;

  beforeEach(() => {
    vi.useFakeTimers();
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    vi.restoreAllMocks();
  });

  it('wires handlePrefetch with slowNetwork flag and prefetchRoute', () => {
    const prefetchSpy = vi.spyOn(routePrefetchLogic, 'prefetchRoute');

    harness.render(<TestPrefetchComponent slowNetwork={true} idleDelayMs={500} />);

    const eventsBtn = document.getElementById('prefetch-events');
    eventsBtn.click();

    expect(prefetchSpy).toHaveBeenCalledWith('events', { slowNetwork: true });
  });

  it('triggers idle preloading via scheduleIdlePrefetch', () => {
    const scheduleSpy = vi.spyOn(routePrefetchLogic, 'scheduleIdlePrefetch');

    harness.render(<TestPrefetchComponent slowNetwork={false} idleDelayMs={600} />);

    expect(scheduleSpy).toHaveBeenCalledWith({
      delayMs: 600,
      slowNetwork: false,
    });
  });

  it('triggers direct prefetch on fast network when handlePrefetch is called', () => {
    const prefetchSpy = vi.spyOn(routePrefetchLogic, 'prefetchRoute');

    harness.render(<TestPrefetchComponent slowNetwork={false} idleDelayMs={500} />);

    const contactBtn = document.getElementById('prefetch-contact');
    contactBtn.click();

    expect(prefetchSpy).toHaveBeenCalledWith('contact', { slowNetwork: false });
  });
});
