import { Link } from 'react-router';
import Navbar from '../LandingPage/Navbar/Navbar.jsx';
import Footer from '../LandingPage/Footer/Footer.jsx';

/**
 * NotFound — friendly 404 for unknown routes. Matches the site's dark theme
 * and gives the visitor one obvious way out (back home).
 */
function NotFound() {
  return (
    <div className="bg-[#0b0b0c] min-h-screen flex flex-col">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center pt-24"
      >
        <p
          className="text-8xl md:text-9xl font-extrabold tracking-tight bg-gradient-to-b from-white via-white to-gray-600 bg-clip-text text-transparent select-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="sr-only">Page not found</h1>
        <div
          className="w-12 h-px bg-gradient-to-r from-[#007aff]/70 to-transparent"
          aria-hidden="true"
        />
        <p className="text-gray-300 text-lg max-w-md">
          Looks like this page drifted off the map. Let&apos;s get you back to the good stuff.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors"
        >
          <span aria-hidden="true">←</span> Back to Home
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default NotFound;
