import './App.css';
// Minimal AOS stylesheet — the full aos/dist/aos.css (~26KB) enumerates every
// duration/easing variant; this site uses 5 animations × 4 durations. The
// subset is guarded by tests/unit/aosCss.spec.js (any new data-aos value must
// extend src/assets/aos-min.css in the same change).
import './assets/aos-min.css';
import { Suspense, useEffect } from 'react';
import SectionSkeleton from './Components/SectionSkeleton/SectionSkeleton';
import ScrollGate from './Components/ScrollGate/ScrollGate';
import HeroSection from './Pages/LandingPage/HeroSection/HeroSection';
import Navbar from './Pages/LandingPage/Navbar/Navbar';
import { useLocation } from 'react-router';
import { initAOS } from './utils/aosGating.js';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import useDeviceProfile from './hooks/useLowPower.js';
import { scrollToSectionWhenReady, targetIdFromLocation } from './utils/navigationCoordinator.js';

// Below-the-fold sections are code-split: the heavy Swiper chunk (used by
// Featuring + Execom) and the cube logic only download once the user scrolls
// to them, shrinking the first-load bundle. AOS picks up the newly-mounted
// [data-aos] elements via its built-in MutationObserver.
//
// IMPORTANT: lazy sections must NOT all share one <Suspense> boundary — React
// resolves every child of a suspended boundary in parallel, so a single
// boundary would fire ALL the dynamic imports (including swiper-vendor) at
// boot. Each section gets its own boundary; the two Swiper sections are
// additionally wrapped in <ScrollGate>, which keeps them unmounted (and their
// chunks undownloaded) until the user scrolls near them.
// Below-the-fold sections load through lazyWithRetry (same as the routes): a
// chunk that fails to load — stale deployment hash, a network blip, or a
// backgrounded tab that iOS evicted from memory — is retried once and then
// recovered with a single clean reload instead of surfacing the error
// fallback (see docs/adr/0008).
const AboutUs = lazyWithRetry(() => import('./Components/AboutUs/AboutUs'));
const Featuring = lazyWithRetry(() => import('./Pages/LandingPages/Featuring'));
const Events = lazyWithRetry(() => import('./Pages/LandingPages/Events'));
const Execom = lazyWithRetry(() => import('./Components/Execom/Execom'));
const Footer = lazyWithRetry(() => import('./Pages/LandingPage/Footer/Footer'));

// AOS hides [data-aos] elements (opacity/transform) until they scroll into
// view. Init runs at module scope, before React renders, so when the animation
// gate is active (reduced motion / low-end device) AOS finds no elements to
// unhide and never registers its observer — leaving every [data-aos] element
// stuck invisible. So when gated, initAOS tags <body> and CSS force-shows all
// [data-aos] content (including anything mounted later, e.g. lazy routes).
initAOS();

function App() {
  const location = useLocation();
  // reducedMotion comes from the device-profile seam (detectProfile), not a
  // raw matchMedia re-implementation — the same query, one owner.
  const { reducedMotion } = useDeviceProfile();

  const pageH1 = <h1 className="sr-only">FOCES - Forum of Computer Engineering Students</h1>;

  // Cross-route anchor scroll: delegates try-now, mutation observation for
  // lazy chunks, failsafe polling, and reduced-motion policy to navigationCoordinator.
  useEffect(() => {
    const targetId = targetIdFromLocation(location.state, location.hash);
    if (!targetId) return;

    return scrollToSectionWhenReady({ targetId, reducedMotion });
  }, [location, reducedMotion]);

  return (
    <div className="App bg-[#101011]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        {pageH1}
        <HeroSection />
        <Suspense fallback={<SectionSkeleton height="100vh" label="Loading about" />}>
          <AboutUs />
        </Suspense>
        {/* Swiper sections are scroll-gated: the chunk (swiper-vendor, ~300KB)
            only downloads when the section approaches the viewport. The wrapper
            owns the section id, so anchors/scrollspy/tests still find it. */}
        <ScrollGate id="featuring" placeholderHeight="95vh" label="Loading featuring">
          <Featuring />
        </ScrollGate>
        <Suspense fallback={<SectionSkeleton height="100vh" label="Loading events" />}>
          <Events />
        </Suspense>
        <ScrollGate id="execom" placeholderHeight="110vh" label="Loading team">
          <Execom />
        </ScrollGate>
      </main>
      <Suspense fallback={<SectionSkeleton height="30vh" label="Loading footer" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
