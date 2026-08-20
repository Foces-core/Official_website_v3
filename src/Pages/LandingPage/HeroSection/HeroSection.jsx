import './HeroSection.css';
import { useEffect, useRef } from 'react';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';
import { initHeroWavesStage } from '../../../Components/HeroStage/heroWavesStage.js';

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();

  // Remove the static LCP hero that the build injected into index.html.
  // It ensured the browser could paint the hero image before React mounted
  // (critical on 3G + CPU throttle where React takes ~10 s to mount).
  useEffect(() => {
    document.getElementById('hero-lcp-static')?.remove();
  }, []);

  useEffect(() => {
    const destroy = initHeroWavesStage(myRef.current, {
      lowPower,
      width: window.innerWidth,
    });
    return destroy;
  }, [lowPower]);

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
            (auto) priority; they are small SVGs and can queue behind the PNG.
            Explicit width/height reserve intrinsic space before Tailwind CSS
            loads, preventing CLS from the dimensionless SVGs. */}
        <img
          src={ddd}
          alt="DDD"
          width={689}
          height={25}
          loading="eager"
          decoding="async"
          className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `}
        />
        <img
          src={focespng}
          alt="FOCES"
          width={716}
          height={155}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `}
        />
        <img
          src={foces1}
          alt=""
          aria-hidden="true"
          width={713}
          height={27}
          loading="eager"
          decoding="async"
          className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `}
        />
      </div>
      {/* TEMP: Sentry test button — remove after verifying error tracking */}
      <button
        type="button"
        onClick={() => {
          throw new Error('This is your first error!');
        }}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Break the world
      </button>
    </div>
  );
}

export default HeroSection;
