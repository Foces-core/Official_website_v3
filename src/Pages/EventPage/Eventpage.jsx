import { useState, useEffect } from 'react';
import EventcardL from './EventcardL.jsx';
import EventcardR from './EventcardR.jsx';
import EventCardMobile from './EventCardMobile.jsx';
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';
import EventTitle from '../../assets/Event.svg';
import { featuredEvents } from '../../data/events.js';

function Eventpage() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const eventsList = featuredEvents;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (windowWidth > 1000) {
    return (
      <div className="overflow-x-hidden flex flex-col">
        <Navbar />
        <div className="h-[100%] w-full bg-[#0b0b0c] overflow-hidden flex flex-col justify-center items-center gap-7 p-10 pt-28">
          <img
            src={EventTitle}
            alt="Events"
            className="h-16 md:h-20 w-auto mb-2 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
          {eventsList.map((event, index) => (
            index % 2 === 0
              ? <EventcardL key={event.id} Events={event} priority={index === 0} />
              : <EventcardR key={event.id} Events={event} priority={index === 0} />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#0b0b0c] min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center flex-col bg-[#0b0b0c] pt-24 max-[767px]:pt-[15vh]">
        <img
          src={EventTitle}
          alt="Events"
          className="h-14 w-auto mb-2 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        />
        {eventsList.map((event, index) => (
          <EventCardMobile key={event.id} Events={event} priority={index === 0} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default Eventpage;
