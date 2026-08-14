import PropTypes from 'prop-types';
import { useBlurImage } from './useBlurImage.js';

/**
 * BlurImage — lazy-loads an image with a blur-up placeholder.
 * Automatically elevates fetchPriority to 'high' upon direct user interaction.
 *
 * The state machine (loaded / placeholder removal / priority elevation) lives
 * in the tested useBlurImage hook (useBlurImage.js); this component is wiring.
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
  const { imgRef, loaded, removed, priorityAttr, handleLoad, handleError, handleInteraction } =
    useBlurImage({ src, blurSrc, eager: loading === 'eager' });

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
