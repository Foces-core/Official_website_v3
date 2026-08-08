import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import PropTypes from 'prop-types';
import { sanityImg } from '../../utils/sanityImage.js';

function Modal({ images, open, onClose }) {
  if (!open) return null;

  const slides = (images || []).map((url) => ({
    src: sanityImg(url, 1400),
  }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      plugins={[Zoom, Counter]}
      controller={{ closeOnBackdropClick: true }}
      carousel={{ finite: slides.length <= 1 }}
      animation={{ fade: 200 }}
      styles={{
        container: { backgroundColor: 'rgba(5, 5, 6, 0.92)', backdropFilter: 'blur(10px)' },
        slide: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
