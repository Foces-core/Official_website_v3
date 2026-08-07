/* eslint-disable react-refresh/only-export-components -- entry file: no exports, fast-refresh irrelevant */
import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DeferredAnalytics from './utils/DeferredAnalytics.jsx';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import Grain from './Components/Grain/Grain.jsx';
import useDeviceProfile from './hooks/useLowPower.js';
import './assets/fonts-latin.css';
import './index.css';

const Eventpage = lazy(() => import('./Pages/EventPage/Eventpage'));
const ContactUs = lazy(() => import('./Components/ContactUs/ContactUs.jsx'));

/**
 * First-load branded loader: the coffee mug + FOCES logo covers the very
 * first paint (while the app boots underneath), then fades out. It only runs
 * once per full page load — never on client-side navigation — and it lasts
 * exactly as long as the boot needs: no fixed duration.
 */
function Root() {
  // On genuinely slow/low-end devices, skip the branded splash entirely — an
  // intro animation is wasted time there; showing the page immediately
  // matters more. Everyone else gets the coffee-mug splash (reduced-motion
  // users get a static mug, handled in Loader.css).
  const { slowNetwork, lowPower } = useDeviceProfile();
  const [loaderPhase, setLoaderPhase] = useState(
    () => (slowNetwork || lowPower ? 'gone' : 'show'), // 'show' -> 'fade' -> 'gone'
  );
  // Pre-seeded from the gated state so a profile change later (e.g. network
  // upgrade) can never make the splash flash back on for a skipped user.
  const hiddenRef = useRef(slowNetwork || lowPower);

  useEffect(() => {
    if (slowNetwork || lowPower) return; // gated users get no splash at all

    let disposed = false;
    const hide = () => {
      if (disposed || hiddenRef.current) return;
      hiddenRef.current = true; // idempotent — many triggers, one fade-out
      setLoaderPhase('fade');
      setTimeout(() => setLoaderPhase('gone'), 700); // matches duration-700
    };

    // The mug lasts only as long as the boot genuinely needs:
    //  1. hero fonts are ready AND the first page paint has landed, or
    //  2. the whole page finished loading (window 'load'), or
    //  3. a failsafe at 6s so a stalled resource can never block the page
    //     indefinitely (a hang guard — not a fixed splash duration).
    const paint = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([fonts, paint()]).then(hide);

    window.addEventListener('load', hide, { once: true });
    const failsafe = setTimeout(hide, 6000);

    return () => {
      disposed = true;
      clearTimeout(failsafe);
      window.removeEventListener('load', hide);
    };
  }, [slowNetwork, lowPower]);

  return (
    <>
      {loaderPhase !== 'gone' && (
        <div
          className={`fixed inset-0 z-[100] bg-[#101011] flex items-center justify-center transition-opacity duration-700 ${
            loaderPhase === 'fade' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-hidden={loaderPhase === 'fade'}
        >
          <Loader />
        </div>
      )}
      {/* Lazy routes: gated users get a plain dark frame while the chunk
          loads — no branded intro animation for them. */}
      <Suspense
        fallback={
          slowNetwork || lowPower ? (
            <div className="fixed inset-0 bg-[#101011]" aria-hidden="true" />
          ) : (
            <Loader />
          )
        }
      >
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/events" element={<Eventpage />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </Suspense>
      <Grain />
    </>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <Root />
      <DeferredAnalytics />
    </Router>
  </React.StrictMode>,
);
