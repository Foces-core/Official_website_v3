import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';
import { sanityImg } from '../../utils/sanityImage.js';
import { aosDisabled } from '../../utils/aosGating.js';
import useDeviceProfile from '../../hooks/useLowPower.js';
import 'reactjs-popup/dist/index.css';

function EventcardL({ Events, priority }) {
  const { slowNetwork } = useDeviceProfile();
  const [Expanding, setExpanding] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, disable: aosDisabled });
  }, []);

  const images = Events.images || [];
  const imageSets = Events.imageSets || [];
  const primaryImage = images[0];
  const primarySet = imageSets[0];

  return (
    <div
      className='w-[95%] max-w-6xl bg-[#161618]/80 backdrop-blur-md border border-white/10 rounded-3xl mt-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl hover:border-white/30 transition-all duration-300'
      id='events'
      data-aos='fade-up'
    >
      {/* Poster / Image Section */}
      <div className='w-full md:w-1/2 flex flex-col gap-3'>
        <div
          className='relative w-full rounded-2xl overflow-hidden bg-[#0b0b0c] border border-white/10 shadow-xl cursor-pointer group'
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label={`Open photo gallery for ${Events.name}`}
          onClick={() => setExpanding(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanding(true);
            }
          }}
        >
          {primaryImage && (
            <img
              src={sanityImg(primaryImage, slowNetwork ? 640 : 1000)}
              srcSet={primarySet}
              sizes="(min-width: 768px) 50vw, 92vw"
              alt={Events.name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className='w-full h-auto object-contain bg-[#0b0b0c]'
            />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4'>
            <span className='text-white text-sm font-medium bg-cyan-600/80 px-3 py-1.5 rounded-full backdrop-blur-sm'>
              🔍 Click to View Gallery ({images.length} Photos)
            </span>
          </div>
        </div>

        {images.length > 1 && (
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {images.slice(1, 4).map((img, idx) => (
              <img
                key={idx}
                src={sanityImg(img, slowNetwork ? 160 : 240)}
                srcSet={imageSets[idx + 1]}
                sizes="80px"
                alt=""
                loading="lazy"
                decoding="async"
                className='w-20 h-16 object-cover rounded-xl border border-white/10 cursor-pointer hover:opacity-80 transition-opacity'
                onClick={() => setExpanding(true)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal images={images} open={Expanding} onClose={() => setExpanding(false)} />

      {/* Details Section */}
      <div className='w-full md:w-1/2 flex flex-col justify-between text-white space-y-4'>
        <div>
          <h2 className='text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2'>
            {Events.name}
          </h2>
          <div className='text-gray-300 text-base leading-relaxed mb-4'>
            <BlockContent
              blocks={Events.content}
              projectId='n7hx0w67'
              dataset='production'
            />
          </div>            <div className='text-cyan-400 font-semibold text-sm'>
            📅 Date: {Events.date}
          </div>
        </div>
      </div>
    </div>
  );
}

EventcardL.propTypes = {
  Events: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    imageSets: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.array,
  }).isRequired,
  priority: PropTypes.bool,
};

EventcardL.defaultProps = {
  priority: false,
};

export default EventcardL;
