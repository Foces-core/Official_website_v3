import './initThree.js';
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
  // Respect reduced-motion / Data Saver users (same adaptive signals as the
  // site's low-power mode) — skip the branded splash for them entirely.
  const skipSplash =
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    (typeof navigator !== 'undefined' &&
      !!navigator.connection &&
      navigator.connection.saveData);
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