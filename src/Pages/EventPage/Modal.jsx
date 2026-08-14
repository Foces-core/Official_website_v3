import { useEffect, useRef } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import PropTypes from 'prop-types';
import { acquireScrollLock } from '../../utils/scrollLock.js';

function Modal({ images, open, onClose }) {
  const lightboxRef = useRef(null);

  // Body scroll-lock while the lightbox is open (ref-counted — safe if the
  // navbar drawer or another overlay is locked at the same time).
  useEffect(() => {
    if (!open) return;
    const release = acquireScrollLock();
    return release;
  }, [open]);

  useEffect(() => {
    if (!open || !lightboxRef.current) return;
    const handleFocus = () => {
      const focused = document.activeElement;
      if (focused && focused !== lightboxRef.current?.firstChild) {
        const firstSlide = lightboxRef.current.querySelector('.layertype-image');
        if (firstSlide && !firstSlide.contains(focused)) {
          firstSlide.focus();
        }
      }
    };
    requestAnimationFrame(handleFocus);
  }, [open, lightboxRef]);

  if (!open || !images || images.length === 0) return null;

  // All images are local bundled webp assets (Sanity was removed — see
  // index.html). srcSet is left undefined so the lightbox uses src directly.
  const slides = images.map((url) => ({ src: url, srcSet: undefined }));

  return (
    <Lightbox
      ref={lightboxRef}
      open={open}
      close={onClose}
      slides={slides}
      plugins={[Counter]}
      controller={{ closeOnBackdropClick: true }}
      carousel={{ finite: slides.length <= 1 }}
      animation={{ fade: 200 }}
      styles={{
        container: { backgroundColor: 'rgba(5, 5, 6, 0.92)', backdropFilter: 'blur(10px)' },
        slide: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100vw',
          maxHeight: '100vh',
        },
        image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
      }}
    />
  );
}

Modal.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Modal;
