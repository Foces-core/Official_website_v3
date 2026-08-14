// Decision logic for App.jsx's cross-route anchor scroll — pure functions,
// unit-tested. The MutationObserver / failsafe-polling machinery lives in the
// component; these three decisions are what make it correct:
//
//   - which section id a navigation asks for,
//   - whether the target element exists and has not been scrolled to yet
//     (the old `found` state never reset, so a SECOND anchor navigation
//     silently stopped scrolling and polled uselessly for 5s),
//   - whether the failsafe polling has run out of time.

export function targetIdFromLocation(state, hash) {
  if (state && state.id) return state.id;
  if (hash) return hash.replace('#', '');
  return null;
}

export function shouldScrollToTarget(el, alreadyScrolled) {
  return Boolean(el) && !alreadyScrolled;
}

export function timedOut(startTime, now, limitMs) {
  return now - startTime >= limitMs;
}
