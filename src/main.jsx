import React, { lazy, Suspense, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import './index.css';

const Eventpage = lazy(() => import('./Pages/EventPage/Eventpage'));
const ContactUs = lazy(() => import('./Components/ContactUs/ContactUs.jsx'));

/**
 * First-load branded loader: the cup + FOCES logo animation covers the very
 * first paint (while the app boots underneath), then fades out. It only runs
 * once per full page load — never on client-side navigation.
 */
function Root() {
  // Respect reduced-motion / Data Saver / slow-network / low-end users (same
  // adaptive signals as the site's low-power mode) — skip the branded splash
  // for them entirely so real content paints faster on constrained devices.
  const skipSplash = (() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    if (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        if (conn.saveData) return true;
        const type = (conn.effectiveType || '').toLowerCase();
        if (type === 'slow-2g' || type === '2g') return true;
        if (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.2) return true;
      }
      const cores = navigator.hardwareConcurrency;
      const lowRam =
        typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
      const fewCores = typeof cores !== 'number' || cores <= 4;
      if (lowRam && fewCores) return true;
    } catch {
      // ignore
    }
    return false;
  })();
  const [loaderPhase, setLoaderPhase] = useState(skipSplash ? 'gone' : 'show'); // 'show' -> 'fade' -> 'gone'

  useEffect(() => {
    const t1 = setTimeout(() => setLoaderPhase('fade'), 1600);
    const t2 = setTimeout(() => setLoaderPhase('gone'), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/events" element={<Eventpage />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </Suspense>
    </>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <Root />
      <SpeedInsights />
    </Router>
  </React.StrictMode>
);