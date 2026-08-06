import { useEffect, useRef } from 'react';

// Matches Tailwind max-[767px]:hidden — no rAF on touch layouts where glow is CSS-hidden.
const DESKTOP_MQ = '(min-width: 768px)';
const IDLE_EPS = 0.1;

function Cursor() {
  const cursorOutlineRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafId = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    if (!mq.matches) return;

    // The glow is position:fixed, so it follows the pointer across the whole
    // page. We only want it over the vanta/hero section — hide it everywhere
    // else (non-vanta black sections, about, events, footer, ...).
    const glowEl = cursorOutlineRef.current;
    heroRef.current = glowEl ? glowEl.closest('.HeroSection') : null;
    const hero = heroRef.current;

    let running = false;

    const stopLoop = () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      running = false;
    };

    const updateCursor = () => {
      if (document.hidden) {
        running = false;
        rafId.current = null;
        return;
      }

      const { x, y, targetX, targetY } = posRef.current;
      const ease = 0.15;
      const nextX = x + (targetX - x) * ease;
      const nextY = y + (targetY - y) * ease;
      posRef.current.x = nextX;
      posRef.current.y = nextY;

      if (glowEl) {
        glowEl.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }

      const dx = targetX - nextX;
      const dy = targetY - nextY;
      if (dx * dx + dy * dy < IDLE_EPS * IDLE_EPS) {
        // Snap + idle: no rAF until next mousemove
        posRef.current.x = targetX;
        posRef.current.y = targetY;
        if (glowEl) {
          glowEl.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        }
        running = false;
        rafId.current = null;
        return;
      }

      rafId.current = requestAnimationFrame(updateCursor);
    };

    const startLoop = () => {
      if (running || document.hidden || !mq.matches) return;
      running = true;
      rafId.current = requestAnimationFrame(updateCursor);
    };

    // Only render the glow when the pointer is actually over the hero section.
    const setGlowVisibility = () => {
      if (!glowEl || !hero) return;
      const r = hero.getBoundingClientRect();
      const { targetX, targetY } = posRef.current;
      const inside =
        targetX >= r.left && targetX <= r.right && targetY >= r.top && targetY <= r.bottom;
      glowEl.style.opacity = inside ? '1' : '0';
    };

    const handleMouseMove = (e) => {
      // clientX/Y are viewport-relative — correct for a position:fixed element.
      // pageX/Y would shift the glow by scrollY and desync it from the real cursor.
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      startLoop();
      setGlowVisibility();
    };

    const handleVisibility = () => {
      if (document.hidden) stopLoop();
      // Resume only on next mousemove — avoids burning frames on hidden tabs
    };

    const handleMq = () => {
      if (!mq.matches) stopLoop();
    };

    // Re-evaluate on scroll/resize since the pointer may idle while the page moves.
    const handleScroll = () => setGlowVisibility();

    // Start hidden in case the hero is off-screen on load.
    setGlowVisibility();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    mq.addEventListener('change', handleMq);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      mq.removeEventListener('change', handleMq);
      stopLoop();
    };
  }, []);

  return (
    <div className='overflow-hidden z-10'>
      <div
        className='cursor-outline max-[767px]:hidden h-[1px] w-[1px] bg-[#fff] shadow-[0_0_201px_80px_rgba(255,255,255,0.4)] fixed z-10 pointer-events-none rounded-[50%] left-0 top-0 opacity-0 transition-opacity duration-150 will-change-transform'
        data-cursor-outline
        ref={cursorOutlineRef}
      />
    </div>
  );
}

export default Cursor;
