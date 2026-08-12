import EventCard from './EventCard.jsx';
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';
import { featuredEvents } from '../../data/events.js';

function Eventpage() {
  const eventsList = featuredEvents;

  const skipLink = (
    <a href="#main-content" className="skip-link">
      Skip to content
    </a>
  );

  const heading = <h1 className="sr-only">FOCES Events</h1>;

  // EventCard is fully responsive (mobile stacks, desktop alternates via
  // `reverse`), so no window-width state or resize listener is needed — the
  // old per-resize re-render of the whole card list is gone.
  return (
    <div className="overflow-x-hidden flex flex-col bg-[#0b0b0c] min-h-screen">
      {skipLink}
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        // gap only kicks in at md+: on mobile the cards space themselves via
        // their own my-6 margin (parity with the pre-consolidation layout).
        className="flex flex-col justify-center items-center gap-0 md:gap-7 pt-24 md:pt-28 md:px-10 md:pb-10 max-[767px]:pt-[15vh]"
      >
        {heading}
        {eventsList.map((event, index) => (
          <EventCard
            key={event.id}
            Events={event}
            priority={index === 0}
            reverse={index % 2 === 1}
          />
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default Eventpage;
