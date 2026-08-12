import { useEffect, useState } from 'react';

/**
 * InstallPrompt — lightweight PWA install banner.
 *
 * Holds the browser's `beforeinstallprompt` event (Chrome/Edge/Android) and
 * shows a small dismissible card with an Install button. No third-party libs,
 * no analytics — just a native prompt() call. It never appears:
 *   - on iOS Safari (no beforeinstallprompt; users use "Add to Home Screen"),
 *   - once the app is already installed (appinstalled),
 *   - when running inside a standalone/installed PWA window.
 *
 * The prompt object can only be used once, so the button hides after prompt().
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already running as an installed PWA — nothing to prompt for.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e) => {
      e.preventDefault(); // suppress the default mini-infobar
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

  if (!deferred || dismissed) return null;

  const install = async () => {
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // userChoice can reject if the prompt was already dismissed — ignore
    }
    // The stored event is one-shot; never show the button again this session.
    setDeferred(null);
  };

  return (
    // role=region, not dialog: this is a non-modal banner, and a dialog role
    // without aria-modal confuses AT (and selector-based tooling). It also
    // sits one z-layer below the mobile nav overlay (z-50) so the menu always
    // wins if both ever mount together.
    <div
      role="region"
      aria-label="Install FOCES app"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm bg-[#161618] border border-white/15 rounded-2xl shadow-2xl p-4 flex items-center gap-3"
    >
      <img
        src="/pwa-192.png"
        alt=""
        aria-hidden="true"
        className="w-11 h-11 rounded-xl flex-none"
        width={44}
        height={44}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold leading-tight">Install FOCES</p>
        <p className="text-gray-400 text-xs leading-snug truncate">
          Get the club in your app drawer — works offline.
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="flex-none px-3.5 py-2 rounded-lg bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition-colors"
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="flex-none w-6 h-6 rounded-full text-gray-500 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
