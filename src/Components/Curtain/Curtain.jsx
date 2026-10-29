import { useEffect, useState } from 'react';
import './Curtain.css';
import { CURTAIN_SETTLE_MS, isRevealKey } from '../../utils/curtainLogic.js';

/**
 * Cinematic entry curtain: a full-screen pair of panels shown on every load,
 * regardless of device tier. Any first deliberate interaction — pointer,
 * wheel, touch move, or Enter — parts the panels and reveals the site. The
 * overlay never swallows the triggering event (pointer-events: none), so the
 * first click or scroll also reaches the page beneath.
 */
export default function Curtain() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (open || gone) return undefined;
    const reveal = () => setOpen(true);
    const onKeyDown = (e) => {
      if (isRevealKey(e.key)) reveal();
    };
    const passive = { passive: true };
    window.addEventListener('pointerdown', reveal, passive);
    window.addEventListener('wheel', reveal, passive);
    window.addEventListener('touchmove', reveal, passive);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', reveal);
      window.removeEventListener('wheel', reveal);
      window.removeEventListener('touchmove', reveal);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, gone]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => setGone(true), CURTAIN_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  if (gone) return null;

  return (
    <div className={`site-curtain ${open ? 'site-curtain-open' : ''}`} aria-hidden="true">
      <div className="site-curtain-panel site-curtain-left" />
      <div className="site-curtain-panel site-curtain-right" />
      {!open && <div className="site-curtain-hint">Scroll or press Enter</div>}
    </div>
  );
}
