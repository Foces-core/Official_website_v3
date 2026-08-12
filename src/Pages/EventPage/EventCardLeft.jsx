import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { sanityImg, sanityBlurUrl } from '../../utils/sanityImage.js';
import { preloadImages } from '../../utils/imageCacheManager.js';
import { prioritizeAssetFetch } from '../../utils/priorityScheduler.js';
import useDeviceProfile from '../../hooks/useLowPower.js';
import BlurImage from '../../Components/BlurImage/BlurImage';

function EventCardLeft({ Events, priority }) {
  const { slowNetwork } = useDeviceProfile();
  const [Expanding, setExpanding] = useState(false);

  const images = Events.images || [];
  const imageSets = Events.imageSets || [];
  const primaryImage = images[0];
  const primarySet = imageSets[0];

  useEffect(() => {
    if (images.length > 0) {
      preloadImages(images.map((url) => sanityImg(url, 1400)));
    }
  }, [images]);

  const handleInteraction = () => {
    if (images.length > 0) {
      images.map((url) => sanityImg(url, 1400)).forEach((u) => prioritizeAssetFetch(u));
    }
  };

  return (
    <div
      className="w-[95%] max-w-6xl bg-[#161618]/80 backdrop-blur-md border border-white/10 rounded-3xl mt-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl hover:border-white/30 transition-all duration-300"
      data-aos="fade-up"
      data-aos-duration="1000"
      onMouseEnter={handleInteraction}
      onTouchStart={handleInteraction}
      onFocus={handleInteraction}
    >
      {/* Poster / Image Section */}
      <div className="w-full md:w-1/2 flex flex-col gap-3">
        <div
          className="relative w-full rounded-2xl overflow-hidden bg-[#0b0b0c] border border-white/10 shadow-xl cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label={`Open photo gallery for ${Events.name}`}
          onClick={() => setExpanding(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanding(true);
            }
          }}
        >
          {primaryImage && (
            <BlurImage
              src={sanityImg(primaryImage, slowNetwork ? 640 : 1000)}
              blurSrc={sanityBlurUrl(primaryImage)}
              srcSet={primarySet}
              sizes="(min-width: 768px) 50vw, 92vw"
              alt={Events.name}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className="w-full h-auto object-contain bg-[#0b0b0c]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-10">
            <span className="text-white text-sm font-medium bg-cyan-600/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
              🔍 Click to View Gallery ({images.length} Photos)
            </span>
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.slice(1, 4).map((img, idx) => (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                aria-label={`View photo ${idx + 2}`}
                className="w-20 h-16 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:opacity-80 transition-opacity flex-none"
                onClick={() => setExpanding(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpanding(true);
                  }
                }}
              >
                <BlurImage
                  src={sanityImg(img, slowNetwork ? 160 : 240)}
                  blurSrc={sanityBlurUrl(img)}
                  srcSet={imageSets[idx + 1]}
                  sizes="80px"
                  alt={`${Events.name} gallery photo ${idx + 2}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal images={images} open={Expanding} onClose={() => setExpanding(false)} />

      {/* Details Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-between text-white space-y-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            {Events.name}
          </h2>
          <div className="text-gray-300 text-base leading-relaxed mb-4">
            <p>{Events.desc}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-cyan-400 font-semibold text-sm">📅 Date: {Events.date}</div>
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

EventCardLeft.propTypes = {
  Events: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    websiteUrl: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string),
    imageSets: PropTypes.arrayOf(PropTypes.string),
    desc: PropTypes.string,
  }).isRequired,
  priority: PropTypes.bool,
};

EventCardLeft.defaultProps = {
  priority: false,
};

export default EventCardLeft;
