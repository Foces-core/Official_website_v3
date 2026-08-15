import './HeroSection.css';
import { useEffect, useRef } from 'react';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';
import { scheduleBackgroundTask } from '../../../utils/priorityScheduler.js';
import { isWideScreen } from '../../../utils/breakpoints.js';

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();

  useEffect(() => {
    let vantaEffect = null;
    let cancelled = false;

    // Skip on low-end devices, reduced-motion, or below desktop-wide width
    // (Vanta looks bad on phones/tablets and wastes GPU — breakpoints.js).
    if (lowPower) return;
    if (!isWideScreen(window.innerWidth)) return;

    // iOS reclaims GPU contexts for backgrounded tabs; Vanta's rAF loop then
    // throws on the dead context and the whole app lands on the error screen
    // with nobody to reload it. On context loss, stop Vanta instead — the
    // hero keeps its static layers and the page stays alive. Capture phase:
    // webglcontextlost does not bubble, but capture listeners on an ancestor
    // still see it.
    const heroEl = myRef.current; // stable copy — refs may change by cleanup
    const onContextLost = (event) => {
      event.preventDefault();
      console.info('Hero WebGL context lost — stopping Vanta (iOS background resume).');
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        try {
          vantaEffect.destroy();
        } catch {
          /* already destroyed */
        }
      }
      vantaEffect = null;
    };
    heroEl.addEventListener('webglcontextlost', onContextLost, true);

    // Defer the ~700KB 3D WebGL library to the lowest background load priority
    // so critical page assets, fonts, and interactive elements load first.
    scheduleBackgroundTask(async () => {
      try {
        const [THREE, vantaMod] = await Promise.all([
          import('three'),
          import('vanta/dist/vanta.waves.min'),
        ]);
        const WAVES = vantaMod.default;
        if (cancelled || !myRef.current) return;
        vantaEffect = WAVES({
          el: myRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x1a1a20,
          backgroundColor: 0x0a0a0c,
          shininess: 35.0,
          waveHeight: 18.0,
          waveSpeed: 0.75,
          zoom: 0.85,
        });
        if (cancelled) {
          if (vantaEffect && typeof vantaEffect.destroy === 'function') {
            vantaEffect.destroy();
          }
        }
      } catch (err) {
        console.warn('Vanta Waves init warning:', err);
      }
    });

    return () => {
      cancelled = true;
      heroEl.removeEventListener('webglcontextlost', onContextLost, true);
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        vantaEffect.destroy();
      }
    };
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
