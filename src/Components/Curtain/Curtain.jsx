import { useEffect, useMemo, useState } from 'react';
import './Curtain.css';
import {
  CURTAIN_EMITTERS,
  CURTAIN_POP_COUNT,
  CURTAIN_SETTLE_MS,
  isRevealKey,
} from '../../utils/curtainLogic.js';

const POP_COLORS = ['#fbbf24', '#67e8f9', '#f8fafc', '#fb7185', '#a78bfa'];

/**
 * Cinematic entry curtain: a velvet pair of panels shown on every load,
 * regardless of device tier. Any first deliberate interaction — pointer,
 * wheel, touch move, or Enter — parts the panels and fires a confetti burst
 * from the seam's top. The overlay never swallows the triggering event
 * (pointer-events: none), so the first click or scroll also reaches the
 * page beneath.
 */
export default function Curtain() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  const pops = useMemo(() => {
    const perEmitter = Math.floor(CURTAIN_POP_COUNT / CURTAIN_EMITTERS.length);
    return CURTAIN_EMITTERS.flatMap((emitter, e) =>
      Array.from({ length: perEmitter }, (_, i) => ({
        id: `${e}-${i}`,
        left: emitter.left,
        x: Math.round(Math.sin(i * 2.17 + e) * 40),
        drift:
          emitter.dir === 0
            ? Math.round(Math.sin(i * 1.37) * 160)
            : emitter.dir * (60 + ((i * 37) % 120)),
        drop: 80 + ((i * 47 + e * 31) % 150),
        delay: Math.round(((i * 29 + e * 11) % 240) / 100) / 10,
        color: POP_COLORS[(i + e) % POP_COLORS.length],
      })),
    );
  }, []);

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
      {open && (
        <div className="site-curtain-popper">
          {pops.map((pop) => (
            <i
              key={pop.id}
              className="site-curtain-pop"
              style={{
                left: pop.left,
                '--pop-x': `${pop.x}px`,
                '--pop-drift': `${pop.drift}px`,
                '--pop-drop': `${pop.drop}px`,
                '--pop-delay': `${pop.delay}s`,
                backgroundColor: pop.color,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
