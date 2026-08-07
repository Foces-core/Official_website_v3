import useDeviceProfile from '../../hooks/useLowPower.js';
import './Grain.css';

/**
 * Film-grain texture overlay — a fixed, full-viewport SVG-noise layer that
 * adds a subtle "printed" texture across the whole site. Pure decoration:
 * pointer-events: none, so it never intercepts clicks or keyboard focus.
 *
 * Skipped on genuinely weak devices (slow network / low CPU): the texture is
 * imperceptible there but still costs a paint pass, matching how the hero
 * cube and other heavy effects are degraded. reduced-motion users keep the
 * static texture — the drift is what stops (handled in Grain.css).
 */
function Grain() {
  const { slowNetwork, lowCPU } = useDeviceProfile();

  if (slowNetwork || lowCPU) return null;

  return <div className="grain-overlay" aria-hidden="true" />;
}

export default Grain;
