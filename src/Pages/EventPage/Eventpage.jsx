import { useState, useEffect } from 'react';
import EventCardLeft from './EventCardLeft.jsx';
import EventCardRight from './EventCardRight.jsx';
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

  const skipLink = (
    <a href="#main-content" className="skip-link">
      Skip to content
    </a>
  );

  const heading = (
    <img
      src={EventTitle}
      alt="Events"
      className="w-72 h-[45%] pl-2.5 mb-2 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
    />
  );

  if (windowWidth > 1000) {
    return (
      <div className="overflow-x-hidden flex flex-col">
        {skipLink}
        <Navbar />
        <main id="main-content" tabIndex={-1} className="h-[100%] w-full bg-[#0b0b0c] overflow-hidden flex flex-col justify-center items-center gap-7 p-10 pt-28">
          {heading}
          {eventsList.map((event, index) => (
            index % 2 === 0
              ? <EventCardLeft key={event.id} Events={event} priority={index === 0} />
              : <EventCardRight key={event.id} Events={event} priority={index === 0} />
          ))}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#0b0b0c] min-h-screen">
      {skipLink}
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex justify-center items-center flex-col bg-[#0b0b0c] pt-24 max-[767px]:pt-[15vh]">
        {heading}
        {eventsList.map((event, index) => (
          <EventCardMobile key={event.id} Events={event} priority={index === 0} />
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default Eventpage;
