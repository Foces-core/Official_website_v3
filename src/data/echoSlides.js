// Single source of truth for the Featuring (ECHO) carousel slides (mirrors
// src/data/team.js). The slides used to live inside Featuring.jsx's layout;
// extracting them lets the shape guard (src/utils/validateEchoSlides.js) pin
// them in CI like team/events, and keeps the layout component readable.
import episodeOne from '../assets/episode-1.webp';
import episodeOne480 from '../assets/episode-1-480.webp';
import episodeOne960 from '../assets/episode-1-960.webp';
import episodeOneBlur from '../assets/episode-1.webp?blur&w=128';
import series from '../assets/series.webp';
import series480 from '../assets/series-480.webp';
import series960 from '../assets/series-960.webp';
import seriesBlur from '../assets/series.webp?blur&w=128';
import fourth from '../assets/fourth.webp';
import fourth480 from '../assets/fourth-480.webp';
import fourth960 from '../assets/fourth-960.webp';
import fourthBlur from '../assets/fourth.webp?blur&w=128';
import mentorReveal from '../assets/Mentor_reveal.webp';
import mentorReveal480 from '../assets/Mentor_reveal-480.webp';
import mentorReveal960 from '../assets/Mentor_reveal-960.webp';
import mentorRevealBlur from '../assets/Mentor_reveal.webp?blur&w=128';
import { srcset } from '../utils/srcset.js';

export const echoSlides = [
  {
    image: episodeOne,
    imageSet: srcset([
      [episodeOne, 1280],
      [episodeOne960, 960],
      [episodeOne480, 480],
    ]),
    blur: episodeOneBlur,
    alt: 'ECHO - Episode 1',
  },
  {
    image: series,
    imageSet: srcset([
      [series, 1280],
      [series960, 960],
      [series480, 480],
    ]),
    blur: seriesBlur,
    alt: 'ECHO Series',
  },
  {
    image: mentorReveal,
    imageSet: srcset([
      [mentorReveal, 1280],
      [mentorReveal960, 960],
      [mentorReveal480, 480],
    ]),
    blur: mentorRevealBlur,
    alt: 'ECHO - Mentor Reveal',
  },
  {
    image: fourth,
    imageSet: srcset([
      [fourth, 1280],
      [fourth960, 960],
      [fourth480, 480],
    ]),
    blur: fourthBlur,
    alt: 'ECHO - Fourth',
  },
];

// Swiper's loop mode jams at its append boundary with only slightly more
// slides than slidesPerView (4 slides / up to 3 per view) — so, like the
// Execom cube, we render 3 copies and wrap with a 0ms jump between copies
// (indices 4 and 8 show the same content as index 0), with no loop mode.
export const carouselSlides = [...echoSlides, ...echoSlides, ...echoSlides];
