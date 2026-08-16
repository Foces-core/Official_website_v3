import { scheduleBackgroundTask } from '../../utils/priorityScheduler.js';
import { isWideScreen } from '../../utils/breakpoints.js';

/**
 * HeroWavesStage — deep adapter managing Three.js + Vanta Waves 3D canvas lifecycle.
 * Encapsulates dynamic vendor script loading, iOS WebGL context loss recovery,
 * viewport/low-power gating, and cleanup.
 */

export const VANTA_WAVES_CONFIG = {
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  scale: 1.0,
  scaleMobile: 1.0,
  color: 0x1a1a20,
  backgroundColor: 0x0a0a0c,
  shininess: 35.0,
  waveHeight: 18.0,
  waveSpeed: 0.75,
  zoom: 0.85,
};

/**
 * Checks whether the hero waves 3D stage should mount for a given device & viewport.
 * @param {{ lowPower?: boolean, width?: number }} profile
 * @returns {boolean}
 */
export function shouldInitHeroWaves({
  lowPower = false,
  width = typeof window !== 'undefined' ? window.innerWidth : 0,
}) {
  if (lowPower) return false;
  return isWideScreen(width);
}

/**
 * Default dynamic loader for Three.js and Vanta Waves.
 */
async function defaultWavesLoader() {
  const [THREE, vantaMod] = await Promise.all([
    import('three'),
    import('vanta/dist/vanta.waves.min'),
  ]);
  return [THREE, vantaMod];
}

/**
 * Initializes the Three.js + Vanta Waves WebGL stage on a container element.
 * Handles async script loading, iOS WebGL context loss recovery, and teardown.
 *
 * @param {HTMLElement} containerEl
 * @param {{
 *   lowPower?: boolean,
 *   width?: number,
 *   scheduler?: (fn: () => Promise<void>) => void,
 *   loader?: () => Promise<[any, any]>,
 *   onInit?: (instance: any) => void,
 *   onError?: (error: any) => void,
 * }} options
 * @returns {() => void} destroyHandle
 */
export function initHeroWavesStage(containerEl, options = {}) {
  const {
    lowPower = false,
    width = typeof window !== 'undefined' ? window.innerWidth : 0,
    scheduler = scheduleBackgroundTask,
    loader = defaultWavesLoader,
    onInit,
    onError,
  } = options;

  if (!containerEl || !shouldInitHeroWaves({ lowPower, width })) {
    return () => {};
  }

  let vantaEffect = null;
  let cancelled = false;
  let visibilityObserver = null;
  let isVisible = true;
  let paused = false;

  // The hero's WebGL render loop is the site's biggest continuous CPU cost —
  // it used to render every frame for the entire session on every capable
  // desktop. Pause it whenever the hero leaves the viewport and resume on
  // return. (Background tabs already throttle rAF, so this covers in-page
  // scrolling — the gap.) Vanta drives the loop via its own rAF chain with
  // the pending frame id on `vantaEffect.req`; cancelling that frame stops
  // the chain, and calling `animationLoop()` restarts it. The observer is
  // only attached where the stage actually mounts (wide screens, not
  // lowPower), so mobile / low-end devices are unaffected — same behavior on
  // every desktop size.
  const pauseLoop = () => {
    if (paused || !vantaEffect || typeof vantaEffect.req !== 'number') return;
    cancelAnimationFrame(vantaEffect.req);
    paused = true;
  };

  const resumeLoop = () => {
    if (!paused || !vantaEffect || typeof vantaEffect.animationLoop !== 'function') return;
    vantaEffect.animationLoop();
    paused = false;
  };

  if (typeof IntersectionObserver !== 'undefined') {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) resumeLoop();
      else pauseLoop();
    });
    visibilityObserver.observe(containerEl);
  }

  const onContextLost = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    console.info('Hero WebGL context lost — stopping Vanta (iOS background resume).');
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      try {
        vantaEffect.destroy();
      } catch {
        /* already destroyed */
      }
    }
    vantaEffect = null;
  };

  containerEl.addEventListener('webglcontextlost', onContextLost, true);

  scheduler(async () => {
    try {
      const [THREE, vantaMod] = await loader();
      const WAVES = vantaMod?.default || vantaMod;
      if (cancelled || !containerEl || typeof WAVES !== 'function') return;

      vantaEffect = WAVES({
        el: containerEl,
        THREE,
        ...VANTA_WAVES_CONFIG,
      });

      if (cancelled) {
        if (vantaEffect && typeof vantaEffect.destroy === 'function') {
          vantaEffect.destroy();
          vantaEffect = null;
        }
      } else {
        // If the hero mounted off-screen (e.g. a deep link), the loop must
        // not render until it scrolls into view.
        if (!isVisible) pauseLoop();
        if (typeof onInit === 'function') onInit(vantaEffect);
      }
    } catch (err) {
      if (typeof onError === 'function') {
        onError(err);
      } else {
        console.warn('Vanta Waves init warning:', err);
      }
    }
  });

  return () => {
    cancelled = true;
    if (visibilityObserver) {
      visibilityObserver.disconnect();
      visibilityObserver = null;
    }
    containerEl.removeEventListener('webglcontextlost', onContextLost, true);
    if (vantaEffect && typeof vantaEffect.destroy === 'function') {
      try {
        vantaEffect.destroy();
      } catch {
        /* already destroyed */
      }
      vantaEffect = null;
    }
  };
}
