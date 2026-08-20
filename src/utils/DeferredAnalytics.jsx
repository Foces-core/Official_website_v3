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

    // Only Vercel serves the /_vercel/ analytics script routes. On any other
    // static host the SPA fallback answers with index.html, and the injected
    // <script> then throws a parse error ("Unexpected token '<'"). Probe each
    // route and only boot the integration whose script the platform actually
    // serves — best-effort per integration, never an app error.
    const probe = (url) =>
      typeof fetch === 'function'
        ? fetch(url, { method: 'HEAD' })
            .then((r) => (r.headers.get('content-type') || '').includes('javascript'))
            .catch(() => false)
        : Promise.resolve(false);

    const mountIfServed = (url, importVendor, setter) => {
      probe(url)
        .then((served) => {
          if (!served || cancelled) return null;
          return importVendor();
        })
        .then((mod) => {
          if (!mod || cancelled) return;
          setter(() => mod);
        })
        .catch(() => undefined);
    };

    mountIfServed(
      '/_vercel/speed-insights/script.js',
      () => import('@vercel/speed-insights/react').then((m) => m.SpeedInsights),
      setInsights,
    );
    mountIfServed(
      '/_vercel/insights/script.js',
      () => import('@vercel/analytics/react').then((m) => m.Analytics),
      setAnalytics,
    );

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
