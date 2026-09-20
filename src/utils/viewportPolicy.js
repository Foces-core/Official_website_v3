import {
  SMALL_SCREEN_MAX,
  FEATURING_2COL_MAX,
  featuringSlidesPerView,
  TEAM_WIDE_MIN,
  TEAM_3COL_MIN,
  TEAM_2COL_MIN,
  teamSlidesPerView,
  teamGap,
} from './breakpoints.js';

// Deep viewport policy — single seam for responsive carousel layout.
// Deletion test: delete this module, complexity scatters to Featuring/TeamCarousel
// as duplicated width checks and calc strings.

const FEAT_PAD = 112;
const FEAT_GAP = 50;

/**
 * True when the primary input has no hover (touch phones/tablets). Devices
 * without hover cannot rely on :hover styling, so hover-revealed affordances
 * (e.g. the advisor portrait's color) need a touch-specific policy instead.
 * Zero-throw; injectable window for specs.
 *
 * @param {Window | null} [win]
 * @returns {boolean}
 */
export function isTouchPrimary(win = typeof window !== 'undefined' ? window : null) {
  try {
    return Boolean(win?.matchMedia?.('(hover: none)')?.matches);
  } catch {
    return false;
  }
}

export function getFeaturingLayout(width) {
  const slidesPerView = featuringSlidesPerView(width);
  const spaceBetween = FEAT_GAP;
  let sizes;
  if (width < SMALL_SCREEN_MAX) sizes = `calc(100vw - ${FEAT_PAD}px)`;
  else if (width < FEATURING_2COL_MAX) sizes = `calc((100vw - ${FEAT_PAD}px - ${FEAT_GAP}px) / 2)`;
  else sizes = `calc((100vw - ${FEAT_PAD}px - ${FEAT_GAP * 2}px) / 3)`;
  return { slidesPerView, spaceBetween, sizes };
}

export function getTeamLayout(width, flatCube, isDesktop) {
  if (!flatCube || !isDesktop) {
    return {
      slidesPerView: 1,
      spaceBetween: flatCube ? 20 : 0,
      sizes: isDesktop ? '360px' : '320px',
    };
  }
  const slidesPerView = teamSlidesPerView(width);
  const spaceBetween = teamGap(width);
  let sizes;
  if (width >= TEAM_WIDE_MIN) sizes = 'calc((80vw - 168px) / 4)';
  else if (width >= TEAM_3COL_MIN) sizes = 'calc((80vw - 144px) / 3)';
  else if (width >= TEAM_2COL_MIN) {
    const vw = width < 768 ? '83.33vw' : '80vw';
    sizes = `calc((${vw} - 116px) / 2)`;
  } else sizes = isDesktop ? '360px' : '320px';
  return { slidesPerView, spaceBetween, sizes };
}
