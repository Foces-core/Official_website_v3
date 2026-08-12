import { useEffect, useRef } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import PropTypes from 'prop-types';
import { sanityImg } from '../../utils/sanityImage.js';

function Modal({ images, open, onClose }) {
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
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

  const slides = images.map((url) => ({
    src: sanityImg(url, 1400),
    srcSet:
      typeof url === 'string' && url.includes('cdn.sanity.io')
        ? [
            { src: sanityImg(url, 640), width: 640 },
            { src: sanityImg(url, 1000), width: 1000 },
            { src: sanityImg(url, 1400), width: 1400 },
          ]
        : undefined,
  }));

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
