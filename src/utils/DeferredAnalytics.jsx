import { useEffect, useState } from 'react';

/**
 * Analytics must never compete with the real page for network or CPU on first
 * load. This keeps <SpeedInsights /> and <Analytics /> unmounted at boot and
 * only arms them after a user interaction (pointer/keyboard/scroll/touch), or
 * when the safety timer fires, or once the browser is idle — whichever comes
 * first — so on 2G/3G the FOCES content wins the critical path.
 *
 * Only the Vercel vendor module code (speed-insights/react and
 * analytics/react) is code-split behind the dynamic imports below — React
 * itself is statically imported above and is already part of the app
 * bundle. Each integration loads independently (Promise.allSettled): a
 * failure in one never blocks the other from mounting, and a failed vendor
 * chunk is best-effort — never an app error.
 */
export default function DeferredAnalytics() {
  const [ready, setReady] = useState(false);
  const [Insights, setInsights] = useState(null);
  const [Analytics, setAnalytics] = useState(null);

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
    if (!ready || (Insights && Analytics)) return;
    let cancelled = false;
    // allSettled, not all: a failed vendor chunk must never discard the
    // integration that loaded fine (best-effort per integration).
    Promise.allSettled([
      import('@vercel/speed-insights/react'),
      import('@vercel/analytics/react'),
    ]).then(([speedResult, analyticsResult]) => {
      if (cancelled) return;
      if (speedResult.status === 'fulfilled') setInsights(() => speedResult.value.SpeedInsights);
      if (analyticsResult.status === 'fulfilled')
        setAnalytics(() => analyticsResult.value.Analytics);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, Insights, Analytics]);

  if (!ready || (!Insights && !Analytics)) return null;
  return (
    <>
      {Analytics ? <Analytics /> : null}
      {Insights ? <Insights /> : null}
    </>
  );
}
