// Session-cookie helpers for UI that needs a "once per browser session" flag.
// A session cookie omits Max-Age/Expires, so the browser clears it when the
// session ends and the next browser session starts clean.

export function readSessionFlag(name) {
  if (typeof document === 'undefined') return false;
  // Exact match on the full `name=value` pair — startsWith would also match a
  // hypothetical name=10 twin, and this costs nothing.
  return document.cookie.split('; ').some((c) => c === `${name}=1`);
}

export function writeSessionFlag(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=1; SameSite=Lax; path=/`;
}
