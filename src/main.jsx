/* eslint-disable react-refresh/only-export-components -- entry file: no exports, fast-refresh irrelevant */
import React, { Suspense, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router';
import DeferredAnalytics from './utils/DeferredAnalytics.jsx';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import Grain from './Components/Grain/Grain.jsx';
import InstallPrompt from './Components/InstallPrompt/InstallPrompt.jsx';
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import useDeviceProfile from './hooks/useLowPower.js';
import './assets/fonts-latin.css';
import './index.css';

// Sentry is intentionally NOT statically imported: the SDK (browser tracing +
// replay) is ~100KB and would inflate the initial bundle for every visitor.
// Instead it is fetched on demand, only when a DSN is configured (production).
// Most visits never configure a DSN, so they never download it.
let reportError = () => {};

if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react')
    .then((Sentry) => {
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
      reportError = (error) => Sentry.captureException(error);
    })
    // Best-effort: if the SDK fails to load, fall back to the console-only
    // behavior — never let telemetry break the app.
    .catch(() => {});
}

const Eventpage = lazyWithRetry(() => import('./Pages/EventPage/Eventpage'));
const ContactUs = lazyWithRetry(() => import('./Components/ContactUs/ContactUs.jsx'));
const NotFoundLazy = lazyWithRetry(() => import('./Pages/NotFound/NotFound.jsx'));

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
      // Remove IMMEDIATELY (not via a 700ms timer): the CSS transition on
      // .is-fading animates the fade-out, and a delayed remove() keeps the
      // element in the DOM — which occludes the hero and blocks its LCP
      // entry. Under CPU throttle that setTimeout stretches (measured: ~9s
      // at 4x), exactly the failure the 1.5s failsafe was meant to fix.
      splash.classList.add('is-fading');
      splash.remove();
    };

    // The splash lasts only as long as the boot genuinely needs:
    //  1. first paint landed (double rAF — fires right after the first frame
    //     paints, which is what the hero content is waiting on), or
    //  2. the whole page finished loading (window 'load'), or
    //  3. a hard failsafe at 1.5s so a stalled resource can never occlude the
    //     page. The old path waited on document.fonts.ready too — but a
    //     stalled font fetch keeps that promise pending, and the old 5s
    //     failsafe stretched further under CPU throttle. The preloaded hero
    //     PNG + @fontsource woff2s start at parse time, so painting the page
    //     early costs nothing; keeping an opaque splash over them is what
    //     inflated LCP (measured 9s of occlusion at 4x throttle).
    const paint = () =>
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    paint().then(hide);

    const onLoad = () => hide();
    window.addEventListener('load', onLoad, { once: true });
    const failsafe = setTimeout(hide, 1500);

    return () => {
      disposed = true;
      clearTimeout(failsafe);
      window.removeEventListener('load', onLoad);
    };
  }, [slowNetwork]);

  return (
    <>
      {/* onError must dereference reportError at call time (wrapper closure),
          not snapshot it at render time — otherwise the no-op assigned before
          the async Sentry import resolves would be captured permanently. */}
      <ErrorBoundary onError={(error) => reportError(error)}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/events" element={<Eventpage />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="*" element={<NotFoundLazy />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
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
      <InstallPrompt />
    </Router>
  </React.StrictMode>,
);
