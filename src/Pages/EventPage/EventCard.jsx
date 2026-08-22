import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';
import { DESKTOP_MIN } from '../../utils/breakpoints.js';
import { onActivationKey } from '../../utils/ariaActivation.js';
import BlurImage from '../../Components/BlurImage/BlurImage';

/**
 * Accessible interactive trigger for photo gallery expansion.
 * Coordinates role="button", tabIndex, keyboard activation (Enter/Space), and accessible labels.
 */
function GalleryTrigger({ onOpen, label, hasPopup = false, className = '', children = null }) {
  const handleKeyDown = onActivationKey(onOpen);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup={hasPopup ? 'dialog' : undefined}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}

GalleryTrigger.propTypes = {
  onOpen: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  hasPopup: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

/**
 * EventCard — one responsive card for every breakpoint.
 *
 * Previously there were three near-duplicate components (EventCardLeft /
 * EventCardRight / EventCardMobile) differing only in flex direction and a
 * handful of mobile-vs-desktop classes. This single card covers all sizes via
 * Tailwind responsive variants, so Eventpage no longer tracks window width
 * (and its per-resize re-render is gone with it).
 */
function EventCard({ Events, priority = false, reverse = false }) {
  const [Expanding, setExpanding] = useState(false);
  // INP: every callback/allocation below used to be re-created on each render
  // of the events list (e.g. a sibling card opening its modal re-renders all
  // cards). Memoized so a parent re-render does no per-card allocation work
  // and React can bail out of prop-identity churn.
  const handleOpenGallery = useCallback(() => setExpanding(true), []);
  const handleCloseGallery = useCallback(() => setExpanding(false), []);

  // photos are { url, srcset } pairs (see src/utils/eventPhotos.js) — no more
  // parallel images[i] ↔ imageSets[i] index math to get wrong.
  const photos = useMemo(() => Events.photos || [], [Events.photos]);
  const primary = photos[0];
  const modalImages = useMemo(() => photos.map((photo) => photo.url), [photos]);

  // Images are already cached by the service worker (images-cache-v2,
  // CacheFirst) — the removed imageCacheManager fetched + stored every photo
  // a second time in its own cache. Only warm the browser's HTTP cache for
  // the photos the user is about to look at (modal open intent), on demand.
  const handleInteraction = useCallback(() => {
    photos.forEach((photo) => prioritizeAssetFetch(photo.url));
  }, [photos]);

  return (
    <div
      className={`w-[92%] md:w-[95%] max-w-sm md:max-w-6xl bg-[#161618]/90 md:bg-[#161618]/80 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl my-6 md:mt-10 p-5 md:p-8 flex flex-col md:flex-row ${
        reverse ? 'md:flex-row-reverse' : ''
      } items-center gap-8 shadow-xl md:shadow-2xl hover:border-white/30 transition-all duration-300`}
      data-aos="fade-up"
      data-aos-duration="1000"
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
      onFocus={handleInteraction}
    >
      {/* Poster / Image Section */}
      <div className="w-full md:w-1/2 flex flex-col gap-3">
        <GalleryTrigger
          onOpen={handleOpenGallery}
          hasPopup
          label={`Open photo gallery for ${Events.name}`}
          className="relative w-full rounded-xl md:rounded-2xl overflow-hidden bg-[#0b0b0c] border border-white/10 shadow-md md:shadow-xl cursor-pointer group"
        >
          {primary && (
            <BlurImage
              src={primary.url}
              srcSet={primary.srcset}
              sizes={`(min-width: ${DESKTOP_MIN}px) 50vw, 92vw`}
              // Only the first event's primary carries an LQIP (see
              // src/data/events.js); every other photo lazy-loads plainly.
              blurSrc={priority ? primary.blur : undefined}
              alt={Events.name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="w-full h-auto object-contain bg-[#0b0b0c]"
            />
          )}
          {/* Mobile-only photo count badge */}
          <div className="absolute bottom-2 right-2 bg-cyan-600/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm z-10 md:hidden">
            {photos.length} Photos
          </div>
          {/* Desktop-only hover gallery prompt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-end p-4 z-10">
            <span className="text-white text-sm font-medium bg-cyan-600/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
              🔍 Click to View Gallery ({photos.length} Photos)
            </span>
          </div>
        </GalleryTrigger>

        {photos.length > 1 && (
          <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
            {photos.slice(1, 4).map((photo, idx) => (
              <GalleryTrigger
                key={idx}
                onOpen={handleOpenGallery}
                label={`View photo ${idx + 2}`}
                className="w-20 h-16 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:opacity-80 transition-opacity flex-none"
              >
                <BlurImage
                  src={photo.url}
                  srcSet={photo.srcset}
                  sizes="80px"
                  alt={`${Events.name} gallery photo ${idx + 2}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </GalleryTrigger>
            ))}
          </div>
        )}
      </div>

      <Modal images={modalImages} open={Expanding} onClose={handleCloseGallery} />

      {/* Details Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-between text-white space-y-3 md:space-y-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold md:font-extrabold tracking-tight mb-2">
            {Events.name}
          </h2>
          <div className="text-gray-300 text-sm md:text-base leading-relaxed mb-4">
            <p>{Events.desc}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between md:justify-start gap-4">
            <div className="text-cyan-400 font-semibold text-xs md:text-sm">
              📅 Date: {Events.date}
            </div>
            {Events.websiteUrl && (
              <a
                href={Events.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <span>🌐 Visit Past Event Site</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

EventCard.propTypes = {
  Events: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    websiteUrl: PropTypes.string,
    photos: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
        srcset: PropTypes.string,
      }),
    ),
    desc: PropTypes.string,
  }).isRequired,
  priority: PropTypes.bool,
  reverse: PropTypes.bool,
};

export default EventCard;
