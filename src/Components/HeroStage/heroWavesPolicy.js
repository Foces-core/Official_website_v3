import { isWideScreen } from '../../utils/breakpoints.js';

// Visual configuration is kept separate from the async WebGL lifecycle so
// capability and rendering decisions remain deterministic and mutation-tested.
export const VANTA_WAVES_CONFIG = {
  mouseControls: true,
  touchControls: true,
  gyroControls: false,
  scale: 1,
  scaleMobile: 1,
  color: 0x1a1a20,
  backgroundColor: 0x0a0a0c,
  shininess: 35,
  waveHeight: 18,
  waveSpeed: 0.75,
  zoom: 0.85,
};

/**
 * Decide whether the WebGL hero effect is appropriate for this profile.
 * @param {{ webgl?: boolean, width?: number }} profile
 */
export function shouldInitHeroWaves({
  webgl = true,
  width = typeof window !== 'undefined' ? window.innerWidth : 0,
}) {
  return Boolean(webgl && isWideScreen(width));
}
