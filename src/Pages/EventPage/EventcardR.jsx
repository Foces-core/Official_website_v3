import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';
import 'reactjs-popup/dist/index.css';

function EventcardR({ Events }) {
  const [Expanding, setExpanding] = useState(false);
  const [isEventClosed, setIsEventClosed] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    // Parse the event date
    const eventDate = new Date(Events.date);
    const currentDate = new Date();

    // Compare the event date with the current date
    if (eventDate < currentDate) {
      setIsEventClosed(true);
    }
  }, [Events.date]);

  return (
    <div
      className='h-fit w-[95%] bg-gradient-to-bl from-slate-950 rounded-2xl mt-10 flex flex-wrap justify'
      data-aos='slide-right'
    >
      <div className='w-[45%] m-5 items-start text-white'>
        <h1 className='text-7xl text-left mt-3 mb-3 mr-3'>{Events.name}</h1>
        <p className='text-xl text-left mt-10 mr-5'>
          <BlockContent
            blocks={Events.content}
            projectId='n7hx0w67'
            dataset='production'
          />
          <br />
          {Events.date}
        </p>
        <div className='h-fit flex justify-start items-end transition-all ease-in-out duration-300 p-5'>
          {isEventClosed || Events.ticket === 'closed' ? (
            <span className='text-red-500 font-bold'>Closed</span>
          ) : (
            <a
              className='bg-black hover:bg-blue-700 border-[2px] border-blue-700 hover:border-white hover:scale-105 p-2 rounded-xl text-white transition-all ease-in-out duration-500'
              href={Events.tickets}
            >
              Register Now
            </a>
          )}
        </div>
      </div>
      <a
        className='w-[45%] m-5 flex flex-col gap-3 justify-center'
        onClick={() => setExpanding(!Expanding)}
      >
        {Events.images.map((image, index) => (
          <div
            key={index}
            className='w-[90%] h-24 rounded-[30px] bg-cover'
            style={{ backgroundImage: `url(${image})` }}
            role='img'
            aria-label={`Event image ${index + 1}`}
          ></div>
        ))}
      </a>
      <Modal images={Events.images} open={Expanding} onClose={() => setExpanding(false)} />
    </div>
  );
}

export default EventcardR;
