import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';
import 'reactjs-popup/dist/index.css';

function EventcardL({ Events }) {
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
      className='w-[95%] max-w-6xl bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl mt-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl hover:border-slate-700 transition-all duration-300'
      id='events'
      data-aos='fade-up'
    >
      {/* Poster / Image Section */}
      <div className='w-full md:w-1/2 flex flex-col gap-3'>
        <div
          className='relative w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl cursor-pointer group'
          onClick={() => setExpanding(true)}
        >
          {primaryImage && (
            <img
              src={primaryImage}
              alt={Events.name}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
            />
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4'>
            <span className='text-white text-sm font-medium bg-blue-600/80 px-3 py-1.5 rounded-full backdrop-blur-sm'>
              🔍 Click to View Gallery ({images.length} Photos)
            </span>
          </div>
        </div>

        {images.length > 1 && (
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {images.slice(1, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                className='w-20 h-16 object-cover rounded-xl border border-slate-800 cursor-pointer hover:opacity-80 transition-opacity'
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
          </div>
          <div className='text-blue-400 font-semibold text-sm'>
            📅 Date: {Events.date}
          </div>
        </div>

        <div className='pt-2 flex justify-start items-center'>
          {isEventClosed || Events.ticket === 'closed' ? (
            <span className='inline-block px-4 py-2 bg-red-950/60 border border-red-800 text-red-400 font-semibold text-sm rounded-xl'>
              Registration Closed
            </span>
          ) : (
            <a
              className='inline-block bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-medium text-white shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300'
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

export default EventcardL;
