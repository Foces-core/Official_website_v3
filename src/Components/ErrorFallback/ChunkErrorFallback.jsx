import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import usePersistentErrorRecovery from '../../hooks/usePersistentErrorRecovery.js';
import { isChunkError } from '../../utils/chunkRecovery.js';

/**
 * ChunkErrorFallback — compact fallback for a single lazy island (ScrollGate
 * section, footer) when its chunk fails to load.
 *
 * Reuses the full-page fallback's bounded recovery for every island error:
 * transient failures get one reload, and a repeated failure gets one cache
 * and service-worker recovery. Chunk errors go straight to cache recovery
 * because their lazy-import retry has already run. Recovery is a no-op
 * offline, where reloading would only replay the same failure.
 */
export default function ChunkErrorFallback({ error }) {
  const recoverChunk = isChunkError(error);
  usePersistentErrorRecovery({
    enabled: true,
    forceCacheRecovery: recoverChunk,
  });

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
