import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.jsx';
import Loader from './Components/Loader/Loader.jsx';
import './index.css';

const Eventpage = lazy(() => import('./Pages/EventPage/Eventpage'));
const ContactUs = lazy(() => import('./Components/ContactUs/ContactUs.jsx'));

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/events" element={<Eventpage />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </Suspense>
      <SpeedInsights />
    </Router>
  </React.StrictMode>
);