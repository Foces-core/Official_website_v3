/**
 * ChunkErrorFallback — compact fallback for a single lazy island (ScrollGate
 * section, footer) when its chunk fails to load.
 *
 * Unlike the full-page ErrorFallback it never auto-reloads: a failed chunk
 * offline would just replay the failure. Copy adapts to connectivity —
 * offline users are told to reconnect, online users get a retry button
 * (reload is safe then; Fix-1 gates only the *automatic* recoveries).
 */
export default function ChunkErrorFallback() {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

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
