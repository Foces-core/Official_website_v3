// The app-lifetime AOS viewport failsafe, mounted once in App.
//
// On capable devices, the only thing that ever reveals [data-aos] content is
// AOS's own scroll observer — if its JS breaks, throws, or misses an element
// (a race with a lazy chunk's MutationObserver), visible content can stay
// opacity:0 forever. This backstop force-shows any in-view [data-aos] element
// AOS left hidden, giving capable devices the same guarantee the
// body.aos-disabled CSS net gives gated ones. It only touches what is
// actually on screen, so below-the-fold scroll reveals are untouched when AOS
// works.
//
// Gated devices are skipped — they already get the CSS net, so the JS watch
// would be redundant there. The decision functions (shouldForceShowAos /
// stuckAosInView / aosDisabled) live in utils/aosGating.js; this hook owns
// only the browser lifecycle (listeners, rAF, cleanup) per ADR-0009.
import { useEffect } from 'react';
import { aosDisabled, stuckAosInView } from '../utils/aosGating.js';

export default function useAosFailsafe() {
  useEffect(() => {
    if (aosDisabled()) return undefined;

    let rafId = 0;
    const forceShow = () => {
      stuckAosInView().forEach((el) => el.classList.add('aos-animate'));
    };
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        forceShow();
      });
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    forceShow(); // elements already in the viewport at boot

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
}
