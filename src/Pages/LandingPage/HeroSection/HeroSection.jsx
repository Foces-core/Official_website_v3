import './HeroSection.css';
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../Navbar/Navbar';

function HeroSection() {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  const handleImageClick = (event) => {
    setShowNotifications(!showNotifications);
    event.stopPropagation();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const events = [
    {
      id: 1,
      date: '12 June 2024',
      eventName: 'Event Name 1',
      description: 'This is the space where you share the information regarding the event 1',
    },
    {
      id: 2,
      date: '13 June 2024',
      eventName: 'Event Name 2',
      description: 'This is the space where you share the information regarding the event 2',
    },
    {
      id: 3,
      date: '14 June 2024',
      eventName: 'Event Name 3',
      description: 'This is the space where you share the information regarding the event 3',
    },
    {
      id: 4,
      date: '15 June 2024',
      eventName: 'Event Name 4',
      description: 'This is the space where you share the information regarding the event 4',
    },
  ];

  return (
    <div className='HeroSection bg-[#101011] w-screen h-screen overflow-hidden'>
      <div className="navbar">
        <Navbar />
      </div>
      <div className="hero">
        <img src="././src/assets/ddd.svg" alt="DDD" className='h-[50%] w-[36%] relative top-[25vh] left-[10vw] z-10' />
        <img src="././src/assets/foces.png" alt="FOCES" className='h-[50%] w-[38%] relative top-[30vh] left-[10vw] z-10' />
        <img src="././src/assets/foces1.svg" alt="" className='h-[50%] w-[38%] relative top-[35vh] left-[10vw]' />
        <img src="././src/assets/Mac.png" alt="Apple Mac" className='relative h-[15%] w-[18%] left-[70vw] ' />
        <img src="././src/assets/Notification.png" alt="Notif" className='Notif h-[26vh] absolute bottom-0 right-0 cursor-pointer' onClick={handleImageClick} /> 
      </div>
      <div ref={notificationsRef} className={`notifications h-[60%] w-[28%] absolute bottom-0 right-0 bg-[#101011] rounded-3xl border border-[#D9D9D9] overflow-scroll ${showNotifications ? 'visible' : 'hidden'}`}>
        {events.map((event) => (
            <div key={event.id} className='text-[#D9D9D9] flex flex-col p-9 w-[100%] pr-3'>
              <div className="notif flex justify-between">
                <div className='border h-fit border-[#00FF57] rounded-md'>
                  <img src="././src/assets/speaker.png" alt="" />
                </div>
                <div className=''>
                  <img src="././src/assets/clock.png" alt="" />
                  <p className='text-sm'>{event.date}</p>
                </div>
              </div>
              <div className='w-[85%] ml-[13%] content'>
                <h3 className='font-semibold'>{event.eventName}</h3>
                <p className='text-sm'>{event.description}</p>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default HeroSection;