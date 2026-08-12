import { useEffect, useState } from 'react';

/**
 * Analytics must never compete with the real page for network or CPU on first
 * load. This keeps <SpeedInsights /> unmounted until the browser is idle AND
 * the user has interacted (or scrolled), so on 2G/3G the FOCES content wins
 * every time. If the tab is idle for a long time it still boots once the user
 * touches the page.
 *
 * The @vercel/speed-insights/react module itself is also dynamically imported
 * here (only once `ready` flips) rather than statically, so its code + React
 * share never ship in the initial JS bundle.
 */
export default function DeferredAnalytics() {
  const [ready, setReady] = useState(false);
  const [Insights, setInsights] = useState(null);

  useEffect(() => {
    let done = false;
    let idleId = null;
    const arm = () => {
      if (done) return;
      done = true;
      cleanup();
      if (typeof requestIdleCallback === 'function') {
        idleId = requestIdleCallback(() => setReady(true), { timeout: 3000 });
      } else {
        idleId = setTimeout(() => setReady(true), 2000);
      }
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, arm, { once: true, passive: true }));
    const idleTimeout = setTimeout(arm, 8000); // safety: always boot eventually

    function cleanup() {
      clearTimeout(idleTimeout);
      if (idleId) {
        if (typeof cancelIdleCallback === 'function') {
          cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      }
      events.forEach((e) => window.removeEventListener(e, arm));
    }
    return cleanup;
  }, []);

  useEffect(() => {
    if (!ready || Insights) return;
    let cancelled = false;
    import('@vercel/speed-insights/react')
      .then((m) => {
        if (!cancelled) setInsights(() => m.SpeedInsights);
      })
      .catch(() => {}); // analytics is best-effort — never break the app
    return () => {
      cancelled = true;
    };
  }, [ready, Insights]);

  if (!ready || !Insights) return null;
  return <Insights />;
}
