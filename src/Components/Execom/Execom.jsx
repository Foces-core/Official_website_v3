import React from 'react';
import BlurImage from '../BlurImage/BlurImage';
import useDeviceProfile from '../../hooks/useLowPower.js';
import TeamCarousel from './TeamCarousel';
import { markInteracted } from '../../utils/keyboardLock.js';

import Aleetta from '../../assets/aleeta.webp';
import AleettaBlur from '../../assets/aleeta.webp?blur&w=20';
import Lisha from '../../assets/lisha1.webp';
import LishaBlur from '../../assets/lisha1.webp?blur&w=20';
import Steve from '../../assets/steve.webp';
import SteveBlur from '../../assets/steve.webp?blur&w=20';
import AnnaRachel from '../../assets/anna_rachel.webp';
import AnnaRachelBlur from '../../assets/anna_rachel.webp?blur&w=20';
import Amanul from '../../assets/amanul.webp';
import AmanulBlur from '../../assets/amanul.webp?blur&w=20';
import Abel from '../../assets/abel.webp';
import AbelBlur from '../../assets/abel.webp?blur&w=20';
import Saniya from '../../assets/saniya.webp';
import SaniyaBlur from '../../assets/saniya.webp?blur&w=20';
import Sebin from '../../assets/sebin.webp';
import SebinBlur from '../../assets/sebin.webp?blur&w=20';
import Anjitha from '../../assets/anjitha.webp';
import AnjithaBlur from '../../assets/anjitha.webp?blur&w=20';
import Abhirami from '../../assets/abhirami_p.webp';
import AbhiramiBlur from '../../assets/abhirami_p.webp?blur&w=20';
import Devadarsana from '../../assets/devadarsana.webp?v=3';
import DevadarsanaBlur from '../../assets/devadarsana.webp?blur&w=20&v=3';
import Gopakumar from '../../assets/gopakumar.webp';
import GopakumarBlur from '../../assets/gopakumar.webp?blur&w=20';

import MeetTheTeam from '../../assets/MeetTheTeam.svg';

const cardData = [
  { name: 'Aleetta Mariya Sebastian', img: Aleetta, blur: AleettaBlur, review: 'Chairperson' },
  { name: 'Lisha Jins', img: Lisha, blur: LishaBlur, review: 'Vice Chairperson' },
  { name: 'Steve Jose', img: Steve, blur: SteveBlur, review: 'Secretary' },
  { name: 'Anna Rachel Mathew', img: AnnaRachel, blur: AnnaRachelBlur, review: 'Joint Secretary' },
  { name: 'Amanul Farhan K S', img: Amanul, blur: AmanulBlur, review: 'Treasurer' },
  { name: 'Abel S Mathew', img: Abel, blur: AbelBlur, review: 'Research & Development Lead' },
  { name: 'Saniya K Shibu', img: Saniya, blur: SaniyaBlur, review: 'Program Outreach Coordinator' },
  { name: 'Sebin Mathew', img: Sebin, blur: SebinBlur, review: 'Project Coordinator' },
  { name: 'Anjitha Aravind', img: Anjitha, blur: AnjithaBlur, review: 'Operations Lead' },
  { name: 'Abhirami P', img: Abhirami, blur: AbhiramiBlur, review: 'Design Lead' },
  {
    name: 'Devadarsana R',
    img: Devadarsana,
    blur: DevadarsanaBlur,
    review: 'Public Relations Lead',
  },
];

// 3 copies of the 11 cards for the seamless-infinite wrap (see TeamCarousel).
const cubeSlides = [...cardData, ...cardData, ...cardData];

function Execom() {
  const { lowPower, reducedMotion } = useDeviceProfile();
  const disableAutoplay = reducedMotion;
  const flatCube = lowPower || reducedMotion;
  const [activeCube, setActiveCube] = React.useState(0);
  // The carousel wrapper: pointer use anywhere on it (slides OR dots) marks
  // both TeamCarousel widgets as interacted for arrow-key arbitration.
  const carouselRef = React.useRef(null);

  // Pointer use on the carousel area marks BOTH widgets interacted — the
  // arrow-key arbitration (inside each TeamCarousel) then hands the keys to
  // whichever is actually on screen and last-interacted.
  React.useEffect(() => {
    const mark = () => {
      markInteracted('execom-desk');
      markInteracted('execom-mobile');
    };
    const carouselEl = carouselRef.current;
    carouselEl?.addEventListener('pointerdown', mark, true);
    return () => carouselEl?.removeEventListener('pointerdown', mark, true);
  }, []);

  return (
    <section
      className="min-h-full flex flex-col pt-10 pb-20 overflow-hidden scroll-mt-24"
      id="execom"
    >
      {/* Advisor banner — separate thin strip at the top of the section */}
      <div
        className="m-auto w-[90%] sm:w-5/6 md:w-4/5 px-2 pb-10"
        role="group"
        aria-label="Advisor"
      >
        <div className="relative bg-gradient-to-br from-[#1b1b1f] to-[#121215] border border-white/10 rounded-3xl overflow-hidden flex items-stretch group shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          {/* Ambient accent glows — decorative, purely visual */}
          <div
            aria-hidden="true"
            className="absolute -top-16 -left-16 w-64 h-64 bg-[#007aff]/15 blur-[80px] rounded-full pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 right-0 w-72 h-48 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none"
          />

          {/* Framed portrait — grayscale by default, colour on hover */}
          <div className="relative w-28 sm:w-40 md:w-52 shrink-0 p-3 sm:p-4">
            <div className="relative h-full min-h-28 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
              <BlurImage
                className="object-cover object-top w-full h-full grayscale group-hover:filter-none transition-all duration-500"
                src={Gopakumar}
                blurSrc={GopakumarBlur}
                alt="Gopakumar G"
                loading="lazy"
                decoding="async"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
              />
            </div>
          </div>

          {/* Copy */}
          <div className="relative flex-1 flex flex-col justify-center py-5 pr-5 md:pr-8">
            <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#007aff]/10 border border-[#007aff]/25 text-[#007aff] text-[10px] font-semibold uppercase tracking-[0.22em]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
              </svg>
              Advisor
            </span>
            <div className="mt-3 text-xl sm:text-2xl font-semibold italic bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
              Gopakumar G
            </div>
            <div
              aria-hidden="true"
              className="mt-2 w-10 h-px bg-gradient-to-r from-[#007aff]/70 to-transparent"
            />
            <p className="mt-3 text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl border-l-2 border-[#007aff]/30 pl-3">
              Guiding wisdom behind FOCES — the team looks to Gopakumar Sir for direction,
              mentorship, and the steady hand that keeps our community events running.
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center h-36 pl-6 lg:pl-40 pt-6 pb-12 relative">
        <div className="w-5 h-16 bg-[#4f4f54] relative"></div>
        <div className="absolute w-46 h-6 pl-2.5">
          <img
            src={MeetTheTeam}
            alt="Meet The Team"
            className="meet-the-team-title"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Both TeamCarousel instances stay in the DOM; CSS hides the inactive
          one (sm:block / sm:hidden). E2E selectors (.execom-swiper,
          .execom-cube-swiper, dots as the swiper's direct sibling) rely on
          this structure. */}
      <div ref={carouselRef} className="m-auto w-[90%] sm:w-5/6 md:w-4/5 px-2 relative">
        <TeamCarousel
          widgetId="execom-desk"
          variant="desktop"
          slides={cubeSlides}
          slidesData={cardData}
          flatCube={flatCube}
          disableAutoplay={disableAutoplay}
          activeIndex={activeCube}
          onActiveChange={setActiveCube}
        />
        <TeamCarousel
          widgetId="execom-mobile"
          variant="mobile"
          slides={cubeSlides}
          slidesData={cardData}
          flatCube={flatCube}
          disableAutoplay={disableAutoplay}
          activeIndex={activeCube}
          onActiveChange={setActiveCube}
        />
      </div>
    </section>
  );
}

export default Execom;
