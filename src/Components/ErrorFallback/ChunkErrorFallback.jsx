import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ChunkErrorFallback — compact fallback for a single lazy island (ScrollGate
 * section, footer) when its chunk fails to load. Static message + manual
 * Retry; no auto-reload (an island failure must never reload the page —
 * every failed island reloading at once caused the "retrying everywhere"
 * bug).
 */
export default function ChunkErrorFallback() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );

  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <div
      role="alert"
      aria-label="Section failed to load"
      className="min-h-[40vh] flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <p className="text-white text-sm font-semibold">
        {offline ? 'You are offline' : 'This section failed to load'}
      </p>
      <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
        {offline
          ? 'Showing what is already downloaded — reconnect to load the rest.'
          : 'An unexpected glitch occurred while loading this part of the page.'}
      </p>
      {!offline && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

ChunkErrorFallback.propTypes = {
  error: PropTypes.any,
};
