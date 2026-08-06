import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';

/**
 * Analytics must never compete with the real page for network or CPU on first
 * load. This keeps <SpeedInsights /> unmounted until the browser is idle AND
 * the user has interacted (or scrolled), so on 2G/3G the FOCES content wins
 * every time. If the tab is idle for a long time it still boots once the user
 * touches the page.
 */
export default function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      cleanup();
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => setReady(true), { timeout: 3000 });
      } else {
        setTimeout(() => setReady(true), 2000);
      }
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, arm, { once: true, passive: true }));
    const idleTimeout = setTimeout(arm, 8000); // safety: always boot eventually

    function cleanup() {
      clearTimeout(idleTimeout);
      events.forEach((e) => window.removeEventListener(e, arm));
    }
    return cleanup;
  }, []);

  if (!ready) return null;
  return <SpeedInsights />;
}
