/* eslint-disable react-refresh/only-export-components -- entry file: no exports, fast-refresh irrelevant */
import React, { Suspense, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import ErrorBoundary from './Components/ErrorBoundary/ErrorBoundary.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import { SPLASH_FAILSAFE_MS, skipSplash, paintReady } from './utils/bootSplashLogic.js';
import useExperienceCapabilities from './hooks/useExperienceCapabilities.js';
import './assets/fonts-latin.css';
import './index.css';

// Sentry is intentionally NOT statically imported: the SDK (browser tracing +
// replay) is ~100KB and would inflate the initial bundle for every visitor.
// Instead it is fetched on demand, only when a DSN is configured (production).
// Most visits never configure a DSN, so they never download it.
import {
  SENTRY_IGNORE_ERRORS,
  SENTRY_DENY_URLS,
  shouldDropSentryEvent,
  isIgnorableMessage,
} from './utils/sentryFilter.js';

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
        ignoreErrors: SENTRY_IGNORE_ERRORS,
        denyUrls: SENTRY_DENY_URLS,
        beforeSend(event, hint) {
          if (shouldDropSentryEvent(event, hint)) return null;
          return event;
        },
      });
      reportError = (error) => {
        const msg = error?.message || (typeof error === 'string' ? error : '');
        if (isIgnorableMessage(msg)) return;
        if (
          shouldDropSentryEvent(
            { exception: { values: [{ value: msg }] } },
            { originalException: error },
          )
        )
          return;
        Sentry.captureException(error);
      };
    })
    // Best-effort: if the SDK fails to load, fall back to the console-only
    // behavior — never let telemetry break the app.
    .catch(() => {});
}

// Dev-only DX guard: the contact form silently falls back to mailto when the
// EmailJS keys are missing (resolveSendChannel in useContactForm.js) — surface
// that at boot instead of discovering it on submit. Stripped from production
// builds (import.meta.env.DEV is statically replaced with false).
if (import.meta.env.DEV) {
  const missingEmailJs = [
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ].filter((key) => !import.meta.env[key]);
  if (missingEmailJs.length > 0) {
    console.warn(
      `[foces] Contact form will fall back to mailto: missing ${missingEmailJs.join(', ')}. ` +
        'Copy .env.example to .env and fill them in to enable EmailJS.',
    );
  }
}

const Eventpage = lazyWithRetry(() => import('./Pages/EventPage/Eventpage'), 'events-route');
const ContactUs = lazyWithRetry(
  () => import('./Components/ContactUs/ContactUs.jsx'),
  'contact-route',
);
const NotFoundLazy = lazyWithRetry(() => import('./Pages/NotFound/NotFound.jsx'), 'not-found');

function ScrollToTop() {
  const { pathname, state, hash } = useLocation();
  useEffect(() => {
    if ((state && state.id) || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, state, hash]);
  return null;
}

function Root() {
  const { aosReveals } = useExperienceCapabilities();
  const hiddenRef = useRef(false);

  useEffect(() => {
    const splash = document.getElementById('boot-splash');
    if (!splash) return;

    if (skipSplash(!splash)) {
      splash.remove();
      return;
    }

    let disposed = false;
    const hide = () => {
      if (disposed || hiddenRef.current) return;
      hiddenRef.current = true;
      splash.classList.add('is-fading');
      splash.remove();
    };

    paintReady()
      .then(hide)
      .catch(() => hide());

    const onLoad = () => hide();
    window.addEventListener('load', onLoad, { once: true });
    const failsafe = setTimeout(hide, SPLASH_FAILSAFE_MS);

    return () => {
      disposed = true;
      clearTimeout(failsafe);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  return (
    <>
      <ErrorBoundary onError={(error) => reportError(error)}>
        <Suspense fallback={<Loader />}>
          <div className={aosReveals ? 'site-page-enter' : undefined}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/events" element={<Eventpage />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="*" element={<NotFoundLazy />} />
            </Routes>
          </div>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

const container = document.getElementById('root');

if (window.location.pathname !== '/') {
  document.getElementById('hero-lcp-static')?.remove();
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <ScrollToTop />
      <Root />
    </Router>
  </React.StrictMode>,
);
