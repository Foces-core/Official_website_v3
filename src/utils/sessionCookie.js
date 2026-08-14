// Session-cookie helpers for the InstallPrompt toast (and anything else that
// needs a "once per browser session" flag). A session cookie has no
// Max-Age/Expires — the browser clears it when the session ends, so a
// genuinely new visit gets the prompt again.

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
