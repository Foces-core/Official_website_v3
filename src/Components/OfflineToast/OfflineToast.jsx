import { useState } from 'react';
import './OfflineToast.css';
import useOfflineToast from '../../hooks/useOfflineToast.js';

/**
 * OfflineToast — global offline indicator.
 *
 * Shows a small non-modal pill bottom-center ONLY while the browser reports
 * offline (page boot without connection, or an offline transition later).
 * Reconnect hides it silently — no "back online" toast (owner decision: never
 * interrupt the user when there is no problem). Dismissing hides it until the
 * next offline transition; the online/offline events only fire on actual
 * transitions, so a dismiss can never nag-loop while staying offline.
 *
 * role=status (polite live region): screen readers announce the state change
 * without stealing focus. Sits below the mobile nav overlay (z-50) so the
 * menu always wins if both ever mount.
 */
export default function OfflineToast() {
  const { offlineVisible, epoch } = useOfflineToast();
  // Dismissal is scoped to the transition that caused it: a fresh
  // online/offline event bumps `epoch`, re-arming the pill by pure
  // derivation (no effect-driven reset, no nag-loop while staying offline).
  const [dismissedEpoch, setDismissedEpoch] = useState(-1);
  const dismissed = dismissedEpoch === epoch;

  if (!offlineVisible || dismissed) return null;

  return (
    <div
      role="status"
      aria-label="Offline notice"
      className="offline-toast fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-sm bg-[#161618]/95 backdrop-blur border border-amber-300/30 rounded-xl shadow-2xl px-3.5 py-2.5 flex items-center gap-2.5"
    >
      <span aria-hidden="true" className="relative flex flex-none w-2 h-2">
        <span className="offline-dot absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-60 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-400" />
      </span>
      <p className="flex-1 min-w-0 text-gray-200 text-xs leading-snug">
        You&apos;re offline — showing cached content.
      </p>
      <button
        type="button"
        onClick={() => setDismissedEpoch(epoch)}
        aria-label="Dismiss offline notice"
        className="flex-none w-6 h-6 rounded-full text-gray-500 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
