import React, { useState, useEffect } from 'react';
import EventcardL from './EventcardL.jsx';
import EventcardR from './EventcardR.jsx';
import EventCardMobile from './EventCardMobile.jsx';
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';
import BackToHome from '../../Components/BackToHome.jsx';
import client from '../../../foces-webv23/sanityClient.js';

function Eventpage() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [eventsList, setEventsList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.fetch(
      `*[_type == "event"]{
        Event_name,
        date,
        image1{
          asset ->{
            _id,
            url
          },
          alt
        },
        image2{
          asset ->{
            _id,
            url
          },
          alt
        },
        image3{
          asset ->{
            _id,
            url
          },
          alt
        },
        content,
        tickets,
      }`
    ).then((data) => {
      const formattedEvents = data.map(event => ({
        name: event.Event_name,
        images: [
          event.image1?.asset.url,
          event.image2?.asset.url,
          event.image3?.asset.url
        ],
        date: event.date,
        content: event.content,
        tickets: event.tickets
      }));

      const sortedEvents = formattedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEventsList(sortedEvents);
    }).catch((err) => {
      console.error("Error fetching data from Sanity:", err);
      setError("Failed to fetch event data. Please try again later.");
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (windowWidth > 1000) {
    return (
      <div className="overflow-x-hidden flex flex-col">
        <Navbar />
        <div className="h-[100%] w-full bg-black overflow-hidden flex flex-col justify-center items-center gap-7 p-10 pt-28">
          {eventsList.map((event, index) => (
            index % 2 === 0
              ? <EventcardL key={index} Events={event} />
              : <EventcardR key={index} Events={event} />
          ))}
        </div>
        {/* <BackToHome /> */}
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="flex justify-center items-center flex-col bg-black">
        {eventsList.map((event, index) => (
          <EventCardMobile key={index} Events={event} />
        ))}
      </div>
      {/* <BackToHome /> */}
      <Footer />
    </div>
  );
}

export default Eventpage;
