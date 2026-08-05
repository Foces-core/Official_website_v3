import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';
import { sanityImg } from '../../utils/sanityImage.js';
import useDeviceProfile from '../../hooks/useLowPower.js';
import 'reactjs-popup/dist/index.css';

function EventcardL({ Events, priority }) {
  const { slowNetwork } = useDeviceProfile();
  const [Expanding, setExpanding] = useState(false);
  const [isEventClosed, setIsEventClosed] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    const eventDate = new Date(Events.date);
    const currentDate = new Date();

    if (eventDate < currentDate) {
      setIsEventClosed(true);
    }
  }, [Events.date]);

  const images = Events.images || [];
  const primaryImage = images[0];

  return (
    <div
      className='w-[95%] max-w-6xl bg-[#161618]/80 backdrop-blur-md border border-white/10 rounded-3xl mt-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl hover:border-white/30 transition-all duration-300'
      id='events'
      data-aos='fade-up'
    >
      {/* Poster / Image Section */}
      <div className='w-full md:w-1/2 flex flex-col gap-3'>
        <div
          className='relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-[#0b0b0c] border border-white/10 shadow-xl cursor-pointer group'
          onClick={() => setExpanding(true)}
        >
          {primaryImage && (
            <img
              src={sanityImg(primaryImage, slowNetwork ? 640 : 1000)}
              alt={Events.name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
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

        <div className='pt-2 flex justify-start items-center'>
          {isEventClosed || Events.tickets === 'closed' ? (
            <span className='inline-block px-4 py-2 bg-red-950/60 border border-red-800 text-red-400 font-semibold text-sm rounded-xl'>
              Registration Closed
            </span>
          ) : (
            <a
              className='inline-block bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 rounded-xl font-medium text-white shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300'
              href={Events.tickets}
              target='_blank'
              rel='noreferrer'
            >
              Register Now
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

EventcardL.propTypes = {
  Events: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    tickets: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf(['closed'])]),
    images: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.array,
  }).isRequired,
  priority: PropTypes.bool,
};

EventcardL.defaultProps = {
  priority: false,
};

export default EventcardL;
