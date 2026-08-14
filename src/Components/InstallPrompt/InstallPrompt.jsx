import { useEffect, useState } from 'react';
import './InstallPrompt.css';
import { readSessionFlag, writeSessionFlag } from '../../utils/sessionCookie.js';

const TOAST_MS = 7000; // how long the toast stays before fading out
const FADE_MS = 350; // exit animation length — keep in sync with InstallPrompt.css

// Session-cookie key: once the toast has shown, it stays silent for the rest
// of the browser session (beforeinstallprompt re-fires on every page load,
// so without this the toast nagged on every visit). The helpers live in
// utils/sessionCookie.js (unit-tested); a session cookie has no
// Max-Age/Expires, so a genuinely new visit gets the prompt again.
const SEEN_COOKIE = 'foces-install-seen';

/**
 * InstallPrompt — PWA install toast.
 *
 * Holds the browser's `beforeinstallprompt` event (Chrome/Edge/Android) and
 * shows a small toast top-right, tucked just below the navbar's "Join FOCES"
 * button. It auto-dismisses after ~7s (fade-out) or on the ✕ / Install tap.
 * No third-party libs, no analytics — just a native prompt() call. It never
 * appears:
 *   - on iOS Safari (no beforeinstallprompt; users use "Add to Home Screen"),
 *   - once the app is already installed (appinstalled),
 *   - when running inside a standalone/installed PWA window,
 *   - more than once per browser session (session cookie, see above).
 *
 * The prompt object can only be used once, so the toast hides after prompt().
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already running as an installed PWA — nothing to prompt for.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e) => {
      e.preventDefault(); // suppress the default mini-infobar either way
      if (readSessionFlag(SEEN_COOKIE)) return; // already offered this session — don't nag
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Once the toast actually shows, remember it for this session — even if the
  // user ignores it, the next page load stays quiet until the browser session
  // ends. Idempotent, so StrictMode's double-invoke is harmless.
  useEffect(() => {
    if (!deferred || dismissed) return;
    writeSessionFlag(SEEN_COOKIE);
  }, [deferred, dismissed]);

  // Auto-dismiss: fade out after TOAST_MS, unmount a beat later.
  useEffect(() => {
    if (!deferred || dismissed) return;
    const fadeTimer = setTimeout(() => setLeaving(true), TOAST_MS - FADE_MS);
    const hideTimer = setTimeout(() => setDismissed(true), TOAST_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [deferred, dismissed]);

  if (!deferred || dismissed) return null;

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setDismissed(true), FADE_MS);
  };

  const install = async () => {
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // userChoice can reject if the prompt was already dismissed — ignore
    }
    // The stored event is one-shot; never show the toast again this session.
    setDeferred(null);
  };

  return (
    // role=region, not dialog: this is a non-modal toast, and a dialog role
    // without aria-modal confuses AT (and selector-based tooling). Sits at
    // top-right below the fixed navbar (z-10) and one z-layer below the
    // mobile nav overlay (z-50) so the menu always wins if both ever mount.
    <div
      role="region"
      aria-label="Install FOCES app"
      className={`install-toast fixed top-14 md:top-16 right-3 md:right-5 z-40 w-[calc(100vw-1.5rem)] max-w-xs bg-[#161618]/95 backdrop-blur border border-white/15 rounded-xl shadow-2xl p-3 flex items-center gap-2.5 ${
        leaving ? 'install-toast--leaving' : ''
      }`}
    >
      <img
        src="/pwa-192.png"
        alt=""
        aria-hidden="true"
        className="w-9 h-9 rounded-lg flex-none"
        width={36}
        height={36}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold leading-tight">Install FOCES</p>
        <p className="text-gray-400 text-[11px] leading-snug truncate">
          Get the club in your app drawer — works offline.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="flex-none px-3 py-1.5 rounded-lg bg-cyan-400 text-black text-[11px] font-bold hover:bg-cyan-300 transition-colors"
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="flex-none w-6 h-6 rounded-full text-gray-500 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
