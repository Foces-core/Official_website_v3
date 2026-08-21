// Sentry event filtering — pure, testable. Keeps the dashboard free of
// high-volume browser noise that is not actionable (ResizeObserver, chunk
// reloads, extensions, aborted fetches). No runtime gate — just a beforeSend
// hook wired in main.jsx.

export const SENTRY_IGNORE_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop',
  'Loading chunk',
  'Loading CSS chunk',
  'ChunkLoadError',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'AbortError',
  'NetworkError when attempting to fetch resource',
  'Non-Error promise rejection captured',
  'Non-Error exception captured',
  'cancelled',
];

export const SENTRY_DENY_URLS = [
  /extensions\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-extension:\/\//i,
  /^safari-web-extension:\/\//i,
];

/**
 * Whether a raw error message/value should be ignored by Sentry.
 * @param {string} value
 * @returns {boolean}
 */
export function isIgnorableMessage(value) {
  if (!value || typeof value !== 'string') return false;
  return SENTRY_IGNORE_ERRORS.some((p) => value.includes(p));
}

/**
 * Whether an event's URL should be denied (browser extensions).
 * @param {string} url
 * @returns {boolean}
 */
export function isDeniedUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return SENTRY_DENY_URLS.some((re) => re.test(url));
}

/**
 * Decide whether a Sentry event should be dropped in beforeSend.
 * @param {object} event - Sentry event
 * @param {object} hint - Sentry hint (originalException etc)
 * @returns {boolean} true if the event should be dropped
 */
export function shouldDropSentryEvent(event, hint) {
  // Extension frames — check culprit, request url, and stack frames
  const urls = [
    event.request?.url,
    event.culprit,
    ...(event.exception?.values?.flatMap((v) =>
      (v.stacktrace?.frames || []).map((f) => f.filename),
    ) || []),
    ...(event.stacktrace?.frames || []).map((f) => f.filename),
  ].filter(Boolean);
  if (urls.some(isDeniedUrl)) return true;

  // Message / exception value
  const values = [
    event.message,
    ...(event.exception?.values || []).map((v) => v.value),
    hint?.originalException?.message,
    typeof hint?.originalException === 'string' ? hint.originalException : null,
  ].filter(Boolean);
  if (values.some(isIgnorableMessage)) return true;

  // Transaction / breadcrumb noise from aborted fetches handled by retry logic
  const excType = event.exception?.values?.[0]?.type;
  if (excType === 'AbortError') return true;

  return false;
}
