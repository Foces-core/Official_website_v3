import { useMemo } from 'react';
import PropTypes from 'prop-types';
import useDeviceProfile from '../../hooks/useLowPower.js';
import { useBlurImage } from './useBlurImage.js';
import { resolveMaxImageWidth, capSrcset } from '../../utils/imagePolicy.js';

/**
 * BlurImage — lazy-loads an image with a blur-up placeholder.
 * Automatically elevates fetchPriority to 'high' upon direct user interaction.
 *
 * The state machine (loaded / placeholder removal / priority elevation) lives
 * in the tested useBlurImage hook (useBlurImage.js); this component is wiring.
 *
 * This is also the single seam for the image-policy cap (utils/imagePolicy.js):
 * every photo — events, echo slides, team — renders through here, so the
 * device profile is consulted once, here, and the srcset is capped before it
 * reaches the <img>. A slow-network visitor never downloads a candidate wider
 * than 400w; a low-CPU device tops out at 800w; capable devices get the full
 * triplet.
 */
export default function BlurImage({
  src,
  srcSet,
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

  // Image-policy cap: consult the device profile once per image and drop
  // srcset candidates wider than the cap. Memoized on the profile flags so a
  // connection change (or unrelated re-render) doesn't re-parse the string.
  const { slowNetwork, lowCPU } = useDeviceProfile();
  const cappedSrcSet = useMemo(
    () =>
      srcSet == null ? srcSet : capSrcset(srcSet, resolveMaxImageWidth({ slowNetwork, lowCPU })),
    [srcSet, slowNetwork, lowCPU],
  );

  const showBlur = blurSrc && !removed;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
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
        src={src}
        srcSet={cappedSrcSet}
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
  blurSrc: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
};
