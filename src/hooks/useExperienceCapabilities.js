import useDeviceProfile from './useLowPower.js';
import { resolveExperienceCapabilities } from '../utils/experienceTier.js';

/**
 * useExperienceCapabilities — reactive access to the experience-tier matrix
 * (utils/experienceTier.js). Components read one named capability instead of
 * combining the four raw profile booleans themselves:
 *
 *   const { autoplay, cube3d } = useExperienceCapabilities();
 *
 * Subscribes to connection changes through the same useDeviceProfile seam.
 */
export default function useExperienceCapabilities() {
  const profile = useDeviceProfile();
  return resolveExperienceCapabilities(profile);
}
