import './SectionSkeleton.css';
import PropTypes from 'prop-types';
import detectProfile from '../../utils/detectProfile';

/**
 * Lightweight skeleton placeholder shown while lazy-loaded sections are
 * downloading. Renders 3 subtle shimmer bars in the site's dark palette.
 *
 * On low-power / reduced-motion devices the bars are static (no animation)
 * but still reserve vertical space to prevent layout shift.
 *
 * @param {{ height?: string, label?: string }} props
 */
export default function SectionSkeleton({ height = '80vh', label = 'Loading section' }) {
  // Use the raw detector (not the hook) because this is a Suspense fallback
  // that may render outside a fully mounted React tree
  const { lowPower } = detectProfile();
  const staticClass = lowPower ? ' skeleton-bar--static' : '';

  return (
    <div
      className="skeleton-section bg-[#101011]"
      style={{ minHeight: height }}
      role="status"
      aria-label={label}
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
};
