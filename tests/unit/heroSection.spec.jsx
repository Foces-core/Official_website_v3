import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createHarness } from './harness.jsx';

const { initHeroWavesStage } = vi.hoisted(() => ({ initHeroWavesStage: vi.fn() }));
vi.mock('../../src/hooks/useExperienceCapabilities.js', () => ({
  default: () => ({ webgl: true }),
}));
vi.mock('../../src/Components/HeroStage/heroWavesStage.js', () => ({ initHeroWavesStage }));

import HeroSection from '../../src/Pages/LandingPage/HeroSection/HeroSection.jsx';

describe('HeroSection responsive WebGL lifecycle', () => {
  let harness;
  let originalWidth;

  beforeEach(() => {
    originalWidth = window.innerWidth;
    initHeroWavesStage.mockReset();
    initHeroWavesStage.mockImplementation(() => vi.fn());
    harness = createHarness();
  });

  afterEach(() => {
    harness.unmount();
    Object.defineProperty(window, 'innerWidth', {
      value: originalWidth,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  function resizeTo(width) {
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });
  }

  it('starts and tears down the stage when resizing across the wide-screen gate', () => {
    window.innerWidth = 800;
    const initialCleanup = vi.fn();
    const wideCleanup = vi.fn();
    initHeroWavesStage.mockReturnValueOnce(initialCleanup).mockReturnValueOnce(wideCleanup);

    harness.render(<HeroSection />);
    expect(initHeroWavesStage).toHaveBeenCalledTimes(1);
    expect(initHeroWavesStage.mock.calls[0][1].width).toBe(800);

    resizeTo(1200);
    expect(initialCleanup).toHaveBeenCalledOnce();
    expect(initHeroWavesStage).toHaveBeenCalledTimes(2);
    expect(initHeroWavesStage.mock.calls[1][1].width).toBe(1200);

    resizeTo(900);
    expect(wideCleanup).toHaveBeenCalledOnce();
    expect(initHeroWavesStage).toHaveBeenCalledTimes(3);
    expect(initHeroWavesStage.mock.calls[2][1].width).toBe(900);
  });
});
