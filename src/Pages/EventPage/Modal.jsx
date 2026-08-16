import { useRef } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import PropTypes from 'prop-types';
import useScrollLock from '../../hooks/useScrollLock.js';
import useFocusRestore from '../../hooks/useFocusRestore.js';

function Modal({ images, open, onClose }) {
  const lightboxRef = useRef(null);
  const imagesAvailable = Boolean(images && images.length > 0);
  const isOverlayActive = open && imagesAvailable;

  // The lightbox vendor (yet-another-react-lightbox) handles Escape keydown and
  // internal focus trapping. We supply the missing pieces: ref-counted body
  // scroll locking and WCAG 2.4.3 focus restoration back to the trigger button on close.
  useScrollLock(isOverlayActive);
  useFocusRestore({ isOpen: isOverlayActive });

  if (!isOverlayActive) return null;

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
      carousel={{ finite: slides.length <= 1, preload: 1, swipe: true }}
      animation={{ swipe: 250, fade: 200 }}
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
