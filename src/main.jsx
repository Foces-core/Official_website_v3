/* eslint-disable react-refresh/only-export-components -- entry file: no exports, fast-refresh irrelevant */
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router';
import * as Sentry from '@sentry/react';
import DeferredAnalytics from './utils/DeferredAnalytics.jsx';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import Grain from './Components/Grain/Grain.jsx';
import ErrorFallback from './Components/ErrorFallback/ErrorFallback.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import useDeviceProfile from './hooks/useLowPower.js';
import './assets/fonts-latin.css';
import './index.css';

// Sentry: initialize only when a DSN is configured (production).
// In dev, errors stay in the console — no external service needed.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

const Eventpage = lazyWithRetry(() => import('./Pages/EventPage/Eventpage'));
const ContactUs = lazyWithRetry(() => import('./Components/ContactUs/ContactUs.jsx'));

// Cross-route scroll restoration: every navigation lands at the top unless a
// state.id anchor was passed (App.jsx handles scrolling to that section).
function ScrollToTop() {
  const { pathname, state, hash } = useLocation();
  useEffect(() => {
    if ((state && state.id) || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, state, hash]);
  return null;
}

/**
 * First-load branded loader: the coffee mug + FOCES logo covers the very
 * first paint (while the app boots underneath), then fades out. It only runs
 * once per full page load — never on client-side navigation — and it lasts
 * exactly as long as the boot needs: no fixed duration.
 */
function Root() {
  // First-load loader info screen: displayed for all users (including reduced motion)
  // Reduced-motion users get a static mug & loading text (handled in Loader.css).
  const { slowNetwork } = useDeviceProfile();
  const [loaderPhase, setLoaderPhase] = useState(
    () => (slowNetwork ? 'gone' : 'show'), // 'show' -> 'fade' -> 'gone'
  );
  const hiddenRef = useRef(slowNetwork);

  useEffect(() => {
    if (slowNetwork) return;

    let disposed = false;
    const hide = () => {
      if (disposed || hiddenRef.current) return;
      hiddenRef.current = true; // idempotent — many triggers, one fade-out
      setLoaderPhase('fade');
      setTimeout(() => setLoaderPhase('gone'), 700); // matches duration-700
    };

    // The loader lasts only as long as the boot genuinely needs:
    //  1. hero fonts are ready AND the first page paint has landed, or
    //  2. the whole page finished loading (window 'load'), or
    //  3. a failsafe at 6s so a stalled resource can never block the page
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
  }, [slowNetwork]);

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
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <ErrorFallback error={error} resetError={resetError} />
        )}
      >
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/events" element={<Eventpage />} />
            <Route path="/contact" element={<ContactUs />} />
          </Routes>
        </Suspense>
      </Sentry.ErrorBoundary>
      <Grain />
    </>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <ScrollToTop />
      <Root />
      <DeferredAnalytics />
    </Router>
  </React.StrictMode>,
);
