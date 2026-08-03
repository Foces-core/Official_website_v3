import React, { useState, useEffect } from 'react';
import { motion, spring } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import BlockContent from '@sanity/block-content-to-react';
import Modal from './Modal';

function EventCardMobile({ Events }) {
  const [ExpandingCard, setExpandingCard] = useState(true);
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
      className='h-fit w-fit bg-gradient-to-bl from-slate-950 rounded-xl mt-10 mb-10 flex flex-col overflow-hidden  p-3'
      data-aos='fade-up'
    >
      <div
        animate={{ height: !ExpandingCard ? 'auto' : 580 }}
        transition={spring}
        layout
        className='bg-gradient-to-br from-slate-950 h-fit w-[350px] rounded-lg shadow-2xl shadow-slate-700 '
        style={{
          transition: 'box-shadow 0.7s ease',
        }}
      >
        {console.log(Events)}
        <div className='flex flex-col h-full'>
          <div className='w-full h-full flex flex-col'>
            <a
              className='w-[100%] h-[100%] mt-12 ml-5 flex flex-col gap-3'
              onClick={() => setExpanding(!Expanding)}
            >
              {Events.images.map((image, index) => (
                <div
                  key={index}
                  className='bg-slate-700 w-[90%] h-24 rounded-[30px] bg-cover'
                  style={{ backgroundImage: `url(${image})` }}
                  role='img'
                  aria-label={`Event image ${index + 1}`}
                ></div>
              ))}
            </a>

            <Modal images={Events.images} open={Expanding} onClose={() => setExpanding(false)}>
              {console.log(Expanding)}
            </Modal>

            <div className='w-[95%] items-end text-white pr-2'>
              <h1 className='text-6xl text-right mb-1 ml-3 '>{Events.name}</h1>
              <p className='text-base text-left mt-1 ml-5'>
                <BlockContent
                  blocks={Events.content}
                  projectId='n7hx0w67'
                  dataset='production'
                />
                <br />
                {Events.date}
              </p>

              <div className='h-[15%] mb-3 flex justify-end items-end transition-all ease-in-out duration-300'>
                {isEventClosed || Events.ticket === 'closed' ? (
                  <span className='text-red-500 font-bold'>Closed</span>
                ) : (
                  <a
                    className='bg-black hover:bg-blue-700 border-[2px] border-blue-700 hover:border-white p-2 rounded-xl text-white transition-all ease-in-out duration-300'
                    href={Events.tickets}
                  >
                    Register Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCardMobile;
