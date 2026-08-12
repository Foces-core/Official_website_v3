/* eslint-disable react-refresh/only-export-components -- entry file: no exports, fast-refresh irrelevant */
import React, { Suspense, useEffect, useRef } from 'react';
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
 * First-load boot splash: a static, inline splash in index.html covers first
 * paint from the HTML document (so FCP does not wait on the JS bundle). React
 * only drives its dismissal — once the boot is genuinely ready, or a failsafe
 * elapses, it fades out and removes the element. It only runs once per full
 * page load — never on client-side navigation.
 *
 * Slow/low-end devices (ADR-0001) skip the splash: it is removed immediately,
 * not painted.
 */
function Root() {
  const { slowNetwork } = useDeviceProfile();
  const hiddenRef = useRef(false);

  useEffect(() => {
    const splash = document.getElementById('boot-splash');
    if (!splash) return;

    if (slowNetwork) {
      // ADR-0001: slow/low-end devices get no splash — drop it immediately.
      splash.remove();
      return;
    }

    let disposed = false;
    const hide = () => {
      if (disposed || hiddenRef.current) return;
      hiddenRef.current = true; // idempotent — many triggers, one fade-out
      splash.classList.add('is-fading');
      setTimeout(() => {
        if (!disposed) splash.remove();
      }, 700); // matches #boot-splash transition duration
    };

    // The splash lasts only as long as the boot genuinely needs:
    //  1. hero fonts + first paint landed, or
    //  2. the whole page finished loading (window 'load'), or
    //  3. a failsafe at 5s so a stalled resource can never block the page
    const paint = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([fonts, paint()]).then(hide);

    const onLoad = () => hide();
    window.addEventListener('load', onLoad, { once: true });
    const failsafe = setTimeout(hide, 5000);

    return () => {
      disposed = true;
      clearTimeout(failsafe);
      window.removeEventListener('load', onLoad);
    };
  }, [slowNetwork]);

  return (
    <>
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
