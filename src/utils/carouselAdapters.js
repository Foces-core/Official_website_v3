import {
  flatTrackTransform,
  cubeTrackTransform,
  cubeFaceTransform,
  slideStep,
} from './carouselGeometry.js';

// Deep carousel adapters — one seam for flat vs cube.
// Deletion test: delete this module, useCarousel scatters measure/style/
// transform logic for both modes into one 400-line hook.

export const flatAdapter = {
  measure(track, gap) {
    const first = track.firstElementChild;
    if (!first || first.offsetParent === null) return null;
    const slideWidth = first.getBoundingClientRect().width;
    if (!slideWidth) return null;
    return { slideWidth, step: slideStep(slideWidth, gap) };
  },
  styleTrack(track, root, spv, gap) {
    track.style.display = 'flex';
    track.style.alignItems = 'center';
    track.style.columnGap = `${gap}px`;
    track.style.transformStyle = '';
    track.style.height = '';
    root.style.perspective = '';
    Array.from(track.children).forEach((slide) => {
      slide.style.position = '';
      slide.style.inset = '';
      slide.style.width = '';
      slide.style.height = '';
      slide.style.backfaceVisibility = '';
      slide.style.flex = `0 0 calc((100% - ${gap * (spv - 1)}px) / ${spv})`;
    });
  },
  getTransform(raw, step, dragOffset) {
    return flatTrackTransform(raw, step, dragOffset);
  },
};

export const cubeAdapter = {
  measure(track, root) {
    const faceWidth = track.clientWidth || root?.clientWidth || 0;
    if (!faceWidth) return null;
    const firstCard = track.firstElementChild?.firstElementChild;
    const h = firstCard ? firstCard.offsetHeight : 0;
    if (h) track.style.height = `${h}px`;
    return { faceWidth };
  },
  styleTrack(track, root) {
    root.style.perspective = '1200px';
    track.style.display = '';
    track.style.columnGap = '';
    track.style.transformStyle = 'preserve-3d';
    Array.from(track.children).forEach((slide) => {
      slide.style.position = 'absolute';
      slide.style.inset = '0';
      slide.style.width = '100%';
      slide.style.height = '100%';
      slide.style.backfaceVisibility = 'hidden';
      slide.style.flex = '';
    });
  },
  getTransform(raw, faceWidth, dragAngle) {
    return cubeTrackTransform(raw, dragAngle);
  },
  getFaceTransform(index, radius) {
    return cubeFaceTransform(index, radius);
  },
};

export function getAdapter(mode) {
  return mode === 'cube' ? cubeAdapter : flatAdapter;
}
