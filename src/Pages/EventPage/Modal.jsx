import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Scrollbar, A11y, Keyboard } from 'swiper/modules';
import { sanityImg } from '../../utils/sanityImage.js';

// WCAG 2.1/2.2 + ARIA APG modal pattern:
//  - focus moves to the close button on open
//  - Tab/Shift+Tab are trapped inside the modal (focus stays in the dialog)
//  - focus is restored to the trigger element on close
//  - Escape closes the dialog
function Modal({ images, open, onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', 'Event photo gallery');
    }

    // Move focus into the dialog on open (APG: focus the dialog or first element).
    const raf = requestAnimationFrame(() => {
      if (closeBtnRef.current) closeBtnRef.current.focus();
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // Focus trap: keep Tab cycling within the modal's focusable elements.
      const focusables = dialog
        ? Array.from(
            dialog.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
        : [];
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === dialog || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Intercept Tab before the browser moves focus (capture phase).
    document.addEventListener('keydown', onKeyDown, true);
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = '';
      // Restore focus to the element that opened the modal (APG).
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className='fixed top-0 left-0 right-0 bottom-0 bg-black/70 z-50 overflow-x-hidden'
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        ref={dialogRef}
        className='w-full h-[50%] min-[700px]:w-[90vh] min-[700px]:h-[80vh] flex items-center justify-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black rounded-xl p-1 z-50 shadow-black/50 drop-shadow-lg shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className='absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors duration-200'
          onClick={onClose}
          aria-label='Close gallery'
        >
          ✕
        </button>
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y, Keyboard]}
          slidesPerView={1}
          spaceBetween={50}
          keyboard={{ enabled: true, onlyInViewport: true }}
          navigation={{
            clickable: true,
          }}
          scrollbar={{ draggable: true }}
          pagination={{
            clickable: true,
          }}
          style={{
            "--swiper-navigation-color": "white",
            "--swiper-navigation-size": "30px",
            "--swiper-pagination-color": "white",
            "--swiper-pagination-bullet-inactive-opacity": ".3",
            "--swiper-pagination-bullet-inactive-color": "white",
          }}
          className="mySwiper h-full w-[120%] bg-black p-10 items-center flex justify-center"
        >
          {images.map((url, index) => (
            <SwiperSlide key={index} className='rounded-full flex justify-center items-center'>
              <img
                className='h-fit w-fit rounded-xl ease-in-out duration-200  bg-cover'
                src={sanityImg(url, 1400)}
                alt={`Slide ${index + 1}`}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>,
    document.getElementById('portal')
  );
}

Modal.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Modal;
