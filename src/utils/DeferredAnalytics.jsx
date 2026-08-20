import { useEffect, useState } from 'react';
import {
  VERCEL_INSIGHTS_ROUTE,
  VERCEL_ANALYTICS_ROUTE,
  isVercelScriptResponse,
  mountAnalyticsIfServed,
} from './analyticsProbe.js';

/**
 * Analytics must never compete with the real page for network or CPU on first
 * load. This keeps <SpeedInsights /> and <Analytics /> unmounted at boot and
 * only arms them after a user interaction (pointer/keyboard/scroll/touch), or
 * when the safety timer fires, or once the browser is idle — whichever comes
 * first — so on 2G/3G the FOCES content wins the critical path.
 *
 * Each integration mounts only when Vercel actually serves its /_vercel/
 * script route (decisions live in the pure module analyticsProbe.js): off
 * Vercel the SPA fallback would answer with index.html and the injected
 * <script> would throw a parse error ("Unexpected token '<'").
 *
 * Only the Vercel vendor module code (speed-insights/react and
 * analytics/react) is code-split behind the dynamic imports below — React
 * itself is statically imported above and is already part of the app
 * bundle. Each integration loads independently; a failure in one never
 * blocks the other from mounting, and a failed vendor chunk is
 * best-effort — never an app error.
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
    if (!ready) return;
    let cancelled = false;

    // Network I/O lives here at the wiring layer (ADR-0009); the probe result
    // decision is made by the pure module.
    const probe = (url) => {
      const fetchFn = globalThis.fetch;
      if (typeof fetchFn !== 'function') return Promise.resolve(false);
      return fetchFn(url, { method: 'HEAD' })
        .then(isVercelScriptResponse)
        .catch(() => false);
    };

    mountAnalyticsIfServed({
      url: VERCEL_INSIGHTS_ROUTE,
      probe,
      importVendor: () => import('@vercel/speed-insights/react').then((m) => m.SpeedInsights),
      setter: setInsights,
      isCancelled: () => cancelled,
    });
    mountAnalyticsIfServed({
      url: VERCEL_ANALYTICS_ROUTE,
      probe,
      importVendor: () => import('@vercel/analytics/react').then((m) => m.Analytics),
      setter: setAnalytics,
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready || (!Insights && !Analytics)) return null;
  return (
    <>
      {Analytics ? <Analytics /> : null}
      {Insights ? <Insights /> : null}
    </>
  );
}
