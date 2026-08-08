import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * BlurImage — lazy-loads an image with a blur-up placeholder.
 *
 * For Sanity images: pass `blurSrc` from `sanityBlurUrl()`.
 * For local images: pass `blurSrc` as a tiny base64 data URL (from vite-imagetools ?lqip).
 * If no `blurSrc` is provided, the image loads normally (no blur effect).
 *
 * The blur placeholder is shown until the full image finishes loading,
 * then cross-fades to the sharp version. The placeholder element is
 * removed from the DOM after the transition to avoid extra nodes.
 *
 * @param {object} props
 * @param {string} props.src - Full image URL
 * @param {string} [props.blurSrc] - Tiny blurred placeholder URL/data-URL
 * @param {string} [props.alt] - Alt text
 * @param {string} [props.className] - CSS classes
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {string} [props.loading="lazy"] - Native loading attr
 * @param {string} [props.decoding="async"] - Native decoding attr
 */
export default function BlurImage({
  src,
  blurSrc,
  alt = '',
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [removed, setRemoved] = useState(!blurSrc);
  const imgRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setLoaded(false);
    setRemoved(!blurSrc);
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, blurSrc]);

  const handleLoad = () => {
    setLoaded(true);
    // Remove the placeholder from DOM after the cross-fade completes
    timerRef.current = setTimeout(() => setRemoved(true), 500);
  };

  const handleError = () => {
    // Reveal image element on error so broken image / alt text renders instead of invisible node
    setLoaded(true);
    setRemoved(true);
  };

  const showBlur = blurSrc && !removed;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
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
        alt={alt}
        loading={loading}
        decoding={decoding}
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
  blurSrc: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
};
