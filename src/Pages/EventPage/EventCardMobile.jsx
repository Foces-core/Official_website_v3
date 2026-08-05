import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';
import { sanityImg } from '../../utils/sanityImage.js';
import useDeviceProfile from '../../hooks/useLowPower.js';

function EventCardMobile({ Events, priority }) {
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
      className='w-[92%] max-w-sm bg-[#161618]/90 border border-white/10 rounded-2xl my-6 p-5 flex flex-col gap-4 shadow-xl'
      data-aos='fade-up'
    >
      <div
        className='relative w-full h-52 rounded-xl overflow-hidden bg-[#0b0b0c] border border-white/10 shadow-md cursor-pointer group'
        onClick={() => setExpanding(true)}
      >
        {primaryImage && (
          <img
            src={sanityImg(primaryImage, slowNetwork ? 640 : 1000)}
            alt={Events.name}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
        )}
        <div className='absolute bottom-2 right-2 bg-cyan-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm'>
          {images.length} Photos
        </div>
      </div>

      <Modal images={images} open={Expanding} onClose={() => setExpanding(false)} />

      <div className='text-white space-y-3'>
        <h3 className='text-2xl font-bold tracking-tight text-white'>
          {Events.name}
        </h3>
        <div className='text-gray-300 text-sm leading-relaxed'>
          <BlockContent
            blocks={Events.content}
            projectId='n7hx0w67'
            dataset='production'
          />
        </div>
        <div className='text-cyan-400 font-medium text-xs'>
          📅 {Events.date}
        </div>

        <div className='pt-2 flex justify-start items-center'>
          {isEventClosed || Events.tickets === 'closed' ? (
            <span className='px-3 py-1.5 bg-red-950/60 border border-red-800 text-red-400 font-semibold text-xs rounded-lg'>
              Closed
            </span>
          ) : (
            <a
              className='bg-cyan-600 hover:bg-cyan-500 px-5 py-2 rounded-xl font-medium text-white text-sm shadow-md'
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

EventCardMobile.propTypes = {
  Events: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    tickets: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf(['closed'])]),
    images: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.array,
  }).isRequired,
  priority: PropTypes.bool,
};

EventCardMobile.defaultProps = {
  priority: false,
};

export default EventCardMobile;
