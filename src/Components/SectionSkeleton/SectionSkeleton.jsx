import './SectionSkeleton.css';
import PropTypes from 'prop-types';
import detectProfile from '../../utils/detectProfile';
import { resolveExperienceCapabilities } from '../../utils/experienceTier.js';

/**
 * Lightweight skeleton placeholder shown while lazy-loaded sections are
 * downloading. Renders 3 subtle shimmer bars in the site's dark palette.
 *
 * On low-power / reduced-motion devices the bars are static (no animation)
 * but still reserve vertical space to prevent layout shift.
 *
 * @param {{ height?: string, label?: string, announce?: boolean }} props
 *   announce=false renders a plain placeholder (no role=status): use it for
 *   deferred-but-not-yet-loading content (e.g. ScrollGate pre-mount), where a
 *   live region would make screen readers announce "Loading…" for something
 *   the user hasn't asked for yet.
 */
export default function SectionSkeleton({
  height = '80vh',
  label = 'Loading section',
  announce = true,
}) {
  // Use the raw detector (not the hook) because this is a Suspense fallback
  // that may render outside a fully mounted React tree. The lowPower → static
  // dialect lives in the experience-tier matrix — skeletonMotion is the
  // capability.
  const { skeletonMotion } = resolveExperienceCapabilities(detectProfile());
  const staticClass = skeletonMotion ? '' : ' skeleton-bar--static';

  return (
    <div
      className="skeleton-section bg-[#101011]"
      style={{ minHeight: height }}
      role={announce ? 'status' : undefined}
      aria-label={announce ? label : undefined}
      aria-hidden={announce ? undefined : true}
    >
      <div className={`skeleton-bar skeleton-bar--wide${staticClass}`} />
      <div className={`skeleton-bar skeleton-bar--medium${staticClass}`} />
      <div className={`skeleton-bar skeleton-bar--narrow${staticClass}`} />
    </div>
  );
}

SectionSkeleton.propTypes = {
  height: PropTypes.string,
  label: PropTypes.string,
  announce: PropTypes.bool,
};
