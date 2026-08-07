import { Link } from 'react-router';
import EventTitle from '../../assets/Event.svg';
import { featuredEvents } from '../../data/events.js';

function Events() {
  return (
    <section
      className="bg-[#0b0b0c] text-white py-16 px-4 md:px-12 relative overflow-hidden scroll-mt-24"
      id="events"
    >
      {/* Background Decorative Neon Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Section Header — matches the FEATURING heading sizing */}
        <div
          className="flex flex-col items-center text-center mb-10"
          data-aos="fade-down"
          data-aos-duration="300"
        >
          <img
            src={EventTitle}
            alt="Events"
            className="w-72 h-[45%] pl-2.5"
            data-aos="flip-up"
            data-aos-duration="750"
          />
          <p className="text-gray-400 text-sm md:text-base max-w-xl font-light tracking-wide mt-2">
            Participate in our flagship hackathons, technical workshops, and competitive coding
            arenas.
          </p>
        </div>

        {/* Featured Events Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mb-10">
          {featuredEvents.map((evt, index) => (
            <div
              key={evt.id}
              data-aos="fade-up"
              data-aos-duration="300"
              className="group relative rounded-2xl overflow-hidden bg-[#141416] border border-white/10 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between"
            >
              {/* Image Banner */}
              <div className="relative h-64 w-full overflow-hidden bg-gray-900">
                <img
                  src={evt.image}
                  srcSet={evt.imageSet}
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                  alt={evt.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : undefined}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent opacity-90" />
                <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full border border-cyan-500/30">
                  {evt.tag}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-1">{evt.date}</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                    {evt.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">
                    {evt.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action Button */}
        <div data-aos="fade-up" data-aos-duration="300" className="mt-2">
          <Link
            to="/events"
            onMouseEnter={() => import('../EventPage/Eventpage.jsx').catch(() => {})}
            onTouchStart={() => import('../EventPage/Eventpage.jsx').catch(() => {})}
            className="inline-flex items-center space-x-3 bg-white text-black font-bold text-base px-8 py-3.5 rounded-xl shadow-lg hover:bg-cyan-400 hover:text-black transition-all duration-300 transform hover:scale-105"
          >
            <span>Explore All Events</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Events;
