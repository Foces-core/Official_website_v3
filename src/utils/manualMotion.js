// Reduced motion stops automatic and ambient effects, not the direct result of
// an explicit user action (ADR-0026). These helpers own the opt-in attribute
// that App.css honors under [data-motion-reduced='true'].
export function setManualMotion(el, duration, timing, manual = true) {
  el.style.setProperty('--manual-motion-duration', `${duration}ms`);
  el.style.setProperty('--manual-motion-timing', timing);
  el.style.transition = `transform ${duration}ms ${timing}`;
  if (manual && duration > 0) el.setAttribute('data-manual-motion', 'true');
  else el.removeAttribute('data-manual-motion');
}

export function clearManualMotion(el) {
  if (!el) return;
  el.removeAttribute('data-manual-motion');
  el.style.removeProperty('--manual-motion-duration');
  el.style.removeProperty('--manual-motion-timing');
}
