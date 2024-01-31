import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import Eventpage from './Pages/EventPage/Eventpage';
import ContactUs from './Components/ContactUs/ContactUs.jsx';
import About from './Components/AboutUs/AboutUs.jsx';
import './index.css';

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/events" element={<Eventpage />} />
      <Route path="/contact" element={<ContactUs />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);