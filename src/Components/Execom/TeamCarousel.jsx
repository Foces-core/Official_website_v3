import { useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import useCarousel from '../../hooks/useCarousel.js';
import { useViewportWidth } from '../../hooks/useViewportWidth.js';
import BlurImage from '../BlurImage/BlurImage';
import useCarouselKeyboard from '../../hooks/useCarouselKeyboard.js';
import { copyFor } from '../../utils/carouselWrap.js';
import { TEAM_WIDE_MIN, TEAM_3COL_MIN, TEAM_2COL_MIN } from '../../utils/breakpoints.js';

import '../Execom/custom.css';

/**
 * TeamCarousel — one hand-rolled carousel for both Execom variants.
 *
 * Previously this was two near-duplicate Swiper blocks (desktop cube/slider +
 * mobile cube) — now both render through the shared useCarousel seam, which
 * owns the 3D cube (rotateY 90° per face, no shadows — they smear on the dark
 * bg), the flat fallback (low-power/reduced-motion), swipe/touch drag with
 * gesture ownership (touch-action: none + preventDefault), the arrow-key
 * arbitration registration, and the on-screen autoplay gate.
 *
 * The DOM contract the E2E suite and CSS rely on is unchanged: the root keeps
 * .execom-swiper / .execom-cube-swiper, slides keep .swiper-slide (with
 * data-slide-active toggled by the engine), cards keep .container-execom, and the dots
 * div stays the root's direct sibling.
 */
function TeamCarousel({
  widgetId,
  variant,
  slides,
  slidesData,
  flatCube,
  disableAutoplay,
  activeIndex,
  onActiveChange,
}) {
  const elRef = useRef(null);
  const wrapRef = useRef(null);
  const width = useViewportWidth();

  const total = slidesData.length;
  const isDesktop = variant === 'desktop';

  // Desktop flat mode is responsive (2/3/4 per view, like Swiper's
  // breakpoints); everything else is 1 per view. Re-computed reactively via
  // useViewportWidth, then fed to the hook (its re-style effect re-applies).
  const perView =
    flatCube && isDesktop ? (width >= 1280 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1) : 1;
  const gap = flatCube ? (isDesktop ? (width >= 1024 ? 24 : 20) : 20) : 0;

  const { instanceRef, trackRef } = useCarousel({
    elRef,
    wrapperRef: wrapRef,
    total,
    mode: flatCube ? 'flat' : 'cube',
    slidesPerView: perView,
    spaceBetween: gap,
    autoplayDelay: disableAutoplay ? 0 : isDesktop ? 3500 : 2500,
    initialIndex: total,
    speed: flatCube ? 250 : 400,
    onActiveChange,
  });

  // Arrow-key arbitration: one deep module, one line (see hooks/useCarouselKeyboard.js).
  useCarouselKeyboard({ widgetId, instanceRef, wrapperRef: wrapRef });

  const containerClass = isDesktop
    ? `hidden sm:block ${flatCube ? 'px-12' : 'max-w-[360px] mx-auto py-4'}`
    : 'block sm:hidden max-w-[320px] mx-auto py-4';

  // Responsive image sizes matching the actual slide width. The section is
  // w-4/5 (80vw) at md+, w-5/6 at sm; the px-12 padding reserves 96px total
  // so the edge cards stop short of the nav arrows. Cube/mobile cards are a
  // single centered capped width (360px desktop / 320px mobile).
  const cardSizes = useMemo(() => {
    if (flatCube && isDesktop) {
      if (width >= TEAM_WIDE_MIN) return 'calc((80vw - 168px) / 4)';
      if (width >= TEAM_3COL_MIN) return 'calc((80vw - 144px) / 3)';
      if (width >= TEAM_2COL_MIN) return 'calc((83.33vw - 116px) / 2)';
    }
    return isDesktop ? '360px' : '320px';
  }, [width, flatCube, isDesktop]);

  // Card widths: desktop cube caps at 360px, mobile cube at 320px, desktop
  // flat scales 2-4 per view (~240-300px each). These sizes make 1x viewports
  // download the 400w srcset candidate and 2x retina the full-size file.
  // Card sizes derived from breakpoints.js — same source as teamSlidesPerView.

  const showNavArrows = isDesktop && flatCube;

  const goToSlide = useCallback(
    (i) => {
      const sw = instanceRef.current;
      if (!sw) return;
      const copy = copyFor(sw.activeIndex, total);
      sw.slideTo(copy * total + i, 350);
    },
    [instanceRef, total],
  );

  return (
    <div ref={wrapRef} className={containerClass}>
      <div
        ref={elRef}
        className={`${isDesktop ? 'execom-swiper pb-12' : 'execom-cube-swiper'} relative ${
          flatCube ? '' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div ref={trackRef} className="swiper-wrapper">
          {slides.map((d, index) => (
            <div key={index} className="swiper-slide">
              <div
                className={`container-execom bg-[#161618] border-box relative rounded-3xl overflow-hidden ${
                  isDesktop ? 'group' : ''
                }`}
              >
                {' '}
                <BlurImage
                  className={`object-cover ${d.name === 'Sebin Mathew' ? 'object-center' : 'object-top'} w-full h-full ${isDesktop ? 'card-hover' : ''} grayscale group-hover:filter-none transition-all duration-300`}
                  src={d.img}
                  srcSet={d.srcset}
                  sizes={cardSizes}
                  blurSrc={d.blur}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute rounded-b-3xl bottom-0 w-full bg-gradient-to-t from-black via-black/85 to-transparent p-4 text-left">
                  <div className="text-white text-base font-semibold italic">{d.name}</div>
                  <div className="text-gray-300 text-xs font-light">{d.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Flat desktop mode keeps prev/next arrows (Swiper's navigation was
            rendered by the library; here they're plain buttons). */}
        {showNavArrows && (
          <>
            <button
              type="button"
              aria-label="Previous team member"
              onClick={() => instanceRef.current?.slidePrev()}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Next team member"
              onClick={() => instanceRef.current?.slideNext()}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-lg transition-colors duration-200 backdrop-blur-sm"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Custom 11-dot indicator — the 3-copy wrap means the dots can't be
          generated from the raw index; they map to the logical slides and
          jump within the current copy. Sits as the root's direct sibling
          (selectors in the E2E suite depend on .execom-swiper + div /
          .execom-cube-swiper + div). */}
      <div className="flex justify-center gap-2 mt-2 pb-1">
        {slidesData.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to ${d.name}`}
            onClick={() => goToSlide(i)}
            // 8px dot on a 24px hit area (WCAG 2.2.8 target size): the button
            // is a genuine 24×24 box (min-w-6/min-h-6) with the visible dot
            // centered inside — no padding/margin tricks, which axe reads as
            // overlapping targets.
            className="flex items-center justify-center min-w-6 min-h-6 rounded-full"
          >
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === i ? 'w-6 bg-[#007aff]' : 'w-2 bg-[#4f4f54]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

TeamCarousel.propTypes = {
  widgetId: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['desktop', 'mobile']).isRequired,
  slides: PropTypes.arrayOf(PropTypes.object).isRequired,
  slidesData: PropTypes.arrayOf(PropTypes.object).isRequired,
  flatCube: PropTypes.bool,
  disableAutoplay: PropTypes.bool,
  activeIndex: PropTypes.number,
  onActiveChange: PropTypes.func,
};

TeamCarousel.defaultProps = {
  flatCube: false,
  disableAutoplay: false,
  activeIndex: 0,
  onActiveChange: () => {},
};

export default TeamCarousel;
