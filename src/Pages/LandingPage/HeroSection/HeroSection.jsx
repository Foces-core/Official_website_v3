import './HeroSection.css';
import { useEffect, useRef } from 'react';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useExperienceCapabilities from '../../../hooks/useExperienceCapabilities.js';
import { initHeroWavesStage } from '../../../Components/HeroStage/heroWavesStage.js';

function HeroSection() {
  const myRef = useRef(null);
  const { webgl } = useExperienceCapabilities();

  useEffect(() => {
    const destroy = initHeroWavesStage(myRef.current, {
      webgl,
      width: window.innerWidth,
    });
    return destroy;
  }, [webgl]);

  return (
    <div
      className="HeroSection relative bg-[#0a0a0c] overflow-hidden h-screen"
      id="home"
      tabIndex={-1}
      ref={myRef}
    >
      <div className="hero">
        {/* Only the LCP image gets fetchPriority="high" — a fetch-priority hint
            on every hero layer dilutes the hint and tells the browser to
            download them all eagerly. The decorative layers keep the default
            (auto) priority; they are small SVGs and can queue behind the PNG. */}
        <img
          src={ddd}
          alt="DDD"
          loading="eager"
          decoding="async"
          className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `}
        />
        <img
          src={focespng}
          alt="FOCES"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `}
        />
        <img
          src={foces1}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `}
        />
      </div>
    </div>
  );
}

export default HeroSection;
