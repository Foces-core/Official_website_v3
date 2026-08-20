/**
 * Pure decision module for the Vercel analytics gate (ADR-0009). Zero I/O —
 * the network probe is injected by the wiring in DeferredAnalytics.jsx;
 * every decision here is unit-spec'd in tests/unit/analyticsProbe.spec.js.
 *
 * Why the gate exists: only Vercel serves the /_vercel/ analytics script
 * routes. On any other static host the SPA fallback answers with index.html,
 * and the injected <script> then throws a parse error ("Unexpected token
 * '<'"). Probe each route and only boot the integration whose script the
 * platform actually serves — best-effort per integration, never an app error.
 */
export const VERCEL_INSIGHTS_ROUTE = '/_vercel/speed-insights/script.js';
export const VERCEL_ANALYTICS_ROUTE = '/_vercel/insights/script.js';

const JAVASCRIPT_MIME_TYPES = new Set([
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/ecmascript',
  'text/ecmascript',
]);

/**
 * True only when the platform actually serves the script: a 2xx response
 * whose media type is a JavaScript MIME type. fetch() resolves for 404/500
 * too, and an error page must never count as served. The content-type is
 * normalized (parameters split off, trimmed, lower-cased) so header
 * variations cannot slip past the allowlist.
 */
export function isVercelScriptResponse(resp) {
  if (!resp || !resp.ok) return false;
  const mediaType = String(resp.headers?.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  return JAVASCRIPT_MIME_TYPES.has(mediaType);
}

/**
 * Boots a vendor integration only when its probe reports the route as
 * served. Any vendor-chunk failure is swallowed (best-effort — never an app
 * error), and isCancelled() stops the chain mid-flight after unmount.
 */
export function mountAnalyticsIfServed({ url, probe, importVendor, setter, isCancelled }) {
  const cancelled = () => (isCancelled ? isCancelled() : false);
  return probe(url)
    .then((served) => {
      if (!served || cancelled()) return null;
      return importVendor();
    })
    .then((mod) => {
      if (!mod || cancelled()) return;
      setter(() => mod);
    })
    .catch(() => undefined);
}
