import './HeroSection.css';
import { useEffect, useRef } from 'react';
import Cursor from '../../../Components/Cursor/Cursor';
import ddd from '../../../assets/ddd.svg';
import focespng from '../../../assets/foces.png';
import foces1 from '../../../assets/foces1.svg';
import useDeviceProfile from '../../../hooks/useLowPower.js';

function HeroSection() {
  const myRef = useRef(null);
  const { lowPower } = useDeviceProfile();

  useEffect(() => {
    // Skip the heavy WebGL background entirely on low-power devices
    // (Data Saver, 2G, low RAM, reduced motion) — the three+vanta chunks
    // are never even downloaded in that case.
    if (lowPower) return;

    let vantaEffect = null;
    let cancelled = false;

    // Vanta already skips renderer.render() while the hero is off-screen, but
    // its requestAnimationFrame loop keeps ticking (with a getBoundingClientRect
    // layout read every single frame). Fully stop the loop while the hero is
    // out of view and restart it when it comes back — no destroy/recreate, so
    // no shader recompile hitch on scroll-back.
    const heroVisible = { current: true };

    const pauseVanta = (v) => {
      if (v._focesPaused) return;
      v._focesPaused = true;
      window.cancelAnimationFrame(v.req);
    };
    const resumeVanta = (v) => {
      if (!v._focesPaused) return;
      v._focesPaused = false;
      v.animationLoop(); // re-schedules itself; elapsed time is clamped internally
    };

    let io = null;
    const heroEl = myRef.current;
    if (heroEl && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        heroVisible.current = entry.isIntersecting;
        if (!vantaEffect) return;
        if (entry.isIntersecting) {
          resumeVanta(vantaEffect);
        } else {
          pauseVanta(vantaEffect);
        }
      }, { threshold: 0 });
      io.observe(heroEl);
    }

    // Lazy-load three + vanta AFTER window.THREE is set.
    // (vanta captures window.THREE at module-evaluation time, so a static
    // import would capture it before main.jsx/HeroSection can assign it.)
    (async () => {
      try {
        const THREE = await import('three');
        if (typeof window !== 'undefined') {
          window.THREE = THREE;
        }
        const { default: WAVES } = await import('vanta/dist/vanta.waves.min');
        if (cancelled || !myRef.current) return;
        vantaEffect = WAVES({
          el: myRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          scale: 0.75,
          scaleMobile: 0.5,
          color: 0x000000,
        });
        // Hero may already be off-screen (e.g. page loaded mid-scroll) — flush
        // any pending IO callback so heroVisible reflects reality, then pause
        // immediately so the loop never runs in the background.
        if (io) io.takeRecords();
        if (!heroVisible.current) pauseVanta(vantaEffect);
      } catch (err) {
        console.warn('Vanta Waves init warning:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (io) io.disconnect();
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        vantaEffect.destroy();
      }
    };
  }, [lowPower]);

  return (
    <div
      className={`HeroSection relative ${
        lowPower ? 'bg-[radial-gradient(circle_at_50%_35%,#1b1b20_0%,#0b0b0c_75%)]' : 'bg-transparent'
      } overflow-hidden h-screen cursor-none`}
      id='home'
      ref={myRef}
    >
      <div className="hero">
        <Cursor />
        <img src={ddd} alt="DDD" decoding="async" className={`h-[50%] w-[36%] relative top-[40vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[38vh] `} />
        <img src={focespng} alt="FOCES" fetchPriority="high" decoding="async" className={`h-[50%] w-[38%] relative top-[45vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[40vh] `} />
        <img src={foces1} alt="" decoding="async" className={`h-[50%] w-[38%] relative top-[50vh] left-[10vw] max-[767px]:w-[80%] max-[767px]:top-[41vh] `} />
      </div>
    </div>
  );
}

export default HeroSection;
