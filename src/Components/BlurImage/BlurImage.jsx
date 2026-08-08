import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';

/**
 * BlurImage — lazy-loads an image with a blur-up placeholder.
 * Automatically elevates fetchPriority to 'high' upon direct user interaction.
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
  const [prevSrc, setPrevSrc] = useState(src);
  const [priorityAttr, setPriorityAttr] = useState(() =>
    loading === 'eager' ? 'high' : undefined,
  );
  const imgRef = useRef(null);
  const timerRef = useRef(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setRemoved(!blurSrc);
    setPriorityAttr(loading === 'eager' ? 'high' : undefined);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, blurSrc]);

  const handleInteraction = () => {
    if (!priorityAttr) {
      setPriorityAttr('high');
      prioritizeAssetFetch(src);
    }
  };

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
  blurSrc: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
};
