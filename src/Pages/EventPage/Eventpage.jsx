import { useState, useEffect } from 'react';
import EventcardL from './EventcardL.jsx';
import EventcardR from './EventcardR.jsx';
import EventCardMobile from './EventCardMobile.jsx';
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';
import client from '../../sanityClient.js';
import Loader from '../../Components/Loader/Loader.jsx'; 
import EventTitle from '../../assets/Event.svg';
import codingArenaPoster from '../../assets/coding_arena_4_0_insta.jpg';
import codingArenaPhoto from '../../assets/coding_arena.jpg';
import promptParadoxPoster from '../../assets/the_prompt_paradox_2_0_insta.jpg';
import agenticCodingPoster from '../../assets/agentic_coding_instagram.jpg';
import agenticCodingPhoto from '../../assets/agentic_coding.jpg';

const fallbackEvents = [
  {
    name: 'Agentic Coding Workshop',
    images: [agenticCodingPoster, agenticCodingPhoto],
    date: '2026-08-01',
    content: 'Hands-on workshop on building autonomous AI agents using LLMs, tool calling, and modern web frameworks.',
    tickets: '#'
  },
  {
    name: 'Coding Arena 4.0',
    images: [codingArenaPoster, codingArenaPhoto],
    date: '2026-07-15',
    content: 'The flagship competitive programming challenge testing algorithm design, speed, and problem-solving skills.',
    tickets: '#'
  },
  {
    name: 'The Prompt Paradox 2.0',
    images: [promptParadoxPoster],
    date: '2026-06-20',
    content: 'An interactive prompt engineering competition exploring creative AI generation, constraints, and optimization.',
    tickets: '#'
  }
];

// If a Sanity event comes back without usable images (missing/renamed image
// fields, or a broken asset URL), show the matching local poster so the card
// never renders with a blank image area.
const fallbackImagesByName = Object.fromEntries(
  fallbackEvents.map((e) => [e.name, e.images])
);

function Eventpage() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

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
        ].filter(Boolean),
        date: event.date,
        content: event.content,
        tickets: event.tickets
      })).map((event) => ({
        ...event,
        images: event.images.length > 0 ? event.images : (fallbackImagesByName[event.name] || []),
      }));

      const sortedEvents = formattedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEventsList(sortedEvents.length > 0 ? sortedEvents : fallbackEvents);
      setLoading(false); // Set loading to false when data is fetched
    }).catch((err) => {
      console.error("Error fetching data from Sanity:", err);
      setEventsList(fallbackEvents);
      setLoading(false); // Set loading to false on error
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

  if (loading) {
    return <Loader />;
  }

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
              ? <EventcardL key={index} Events={event} priority={index === 0} />
              : <EventcardR key={index} Events={event} priority={index === 0} />
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
          <EventCardMobile key={index} Events={event} priority={index === 0} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default Eventpage;
