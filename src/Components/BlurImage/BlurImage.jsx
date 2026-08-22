import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useExperienceCapabilities from '../../hooks/useExperienceCapabilities.js';
import { useBlurImage } from './useBlurImage.js';
import { createImageSpec } from '../../utils/imageSpec.js';

/**
 * BlurImage — thin adapter over two pure/tested seams.
 *
 * - Image spec (what to fetch): src/utils/imageSpec.js — pure
 *   createImageSpec({ src, srcSet, sizes, maxWidth }) caps the srcset for
 *   the device. No DOM.
 * - Loaded / placeholder / fetch-priority state machine:
 *   src/Components/BlurImage/useBlurImage.js — the reducer owns all
 *   transitions; this component only wires events and renders.
 *
 * This is also the single seam for the image-policy cap: every photo —
 * events, echo slides, team — renders through here, so the experience-tier
 * matrix is consulted once (imageMaxWidth capability: 400w on slow networks,
 * 800w on low CPU, 1000w capable), here, and the srcset is capped before it
 * reaches the <img>.
 *
 * The wrapper no longer duplicates object-fit utilities (object-cover /
 * object-contain …): those belong on the <img>, not the <div>.
 * Layout utilities (w-full, h-full, rounded-*) stay on the wrapper so
 * overflow-hidden clipping still works.
 */

function stripObjectFit(className) {
  return className
    .split(/\s+/)
    .filter((c) => c.length > 0 && !c.startsWith('object-'))
    .join(' ');
}

export default function BlurImage({
  src,
  srcSet,
  sizes,
  blurSrc,
  alt = '',
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) {
  const { imgRef, loaded, removed, priorityAttr, handleLoad, handleError, handleInteraction } =
    useBlurImage({ src, blurSrc, eager: loading === 'eager' });

  // Image-policy cap: the experience-tier matrix owns the width policy
  // (imageMaxWidth capability) and imageSpec applies it. Memoized on the
  // cap so a connection change (or unrelated re-render) doesn't re-parse
  // the string.
  const { imageMaxWidth } = useExperienceCapabilities();

  const {
    src: specSrc,
    srcSet: cappedSrcSet,
    sizes: specSizes,
  } = useMemo(
    () => createImageSpec({ src, srcSet, sizes, maxWidth: imageMaxWidth }),
    [src, srcSet, sizes, imageMaxWidth],
  );

  const showBlur = blurSrc && !removed;

  const wrapperClass = useMemo(() => {
    const stripped = stripObjectFit(className);
    return stripped ? `relative overflow-hidden ${stripped}` : 'relative overflow-hidden';
  }, [className]);

  return (
    <div
      className={wrapperClass}
      style={{ width, height }}
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
      onFocus={handleInteraction}
    >
      {/* Blur placeholder — sits behind the full image */}
      {showBlur && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: loaded ? 0 : 1, filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {/* Full image — fades in on load */}
      <img
        ref={imgRef}
        src={specSrc}
        srcSet={cappedSrcSet}
        sizes={specSizes}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={priorityAttr}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-500 ${showBlur && !loaded ? 'opacity-0' : 'opacity-100'} ${className}`}
        width={width}
        height={height}
        {...rest}
      />
    </div>
  );
}

BlurImage.propTypes = {
  src: PropTypes.string.isRequired,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  blurSrc: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
};
