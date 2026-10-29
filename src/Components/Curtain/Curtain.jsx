import { useEffect, useMemo, useRef, useState } from 'react';
import './Curtain.css';
import {
  CURTAIN_EMITTERS,
  CURTAIN_POP_COUNT,
  CURTAIN_SETTLE_MS,
  createCurtainParticle,
  isRevealKey,
} from '../../utils/curtainLogic.js';
import { stepParticle } from '../AboutUs/confettiSim.js';

const POP_COLORS = ['#fbbf24', '#f97316', '#67e8f9', '#f8fafc', '#fb7185', '#a78bfa', '#4ade80'];

/**
 * Cinematic entry curtain: a velvet pair of panels shown on every load,
 * regardless of device tier. Any first deliberate interaction — pointer,
 * wheel, touch move, or Enter — parts the panels and fires confetti from
 * three top emitters, stepped by the shared gravity/drag sim. The overlay
 * never swallows the triggering event (pointer-events: none), so the first
 * click or scroll also reaches the page beneath.
 */
export default function Curtain() {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const popRefs = useRef(new Map());

  // Static appearance only — position comes from the physics sim, not CSS.
  const pops = useMemo(() => {
    const perEmitter = Math.floor(CURTAIN_POP_COUNT / CURTAIN_EMITTERS.length);
    return CURTAIN_EMITTERS.flatMap((emitter, e) =>
      Array.from({ length: perEmitter }, (_, i) => ({
        id: `${e}-${i}`,
        left: emitter.left,
        dir: emitter.dir,
        size: 5 + ((i * 13 + e) % 7),
        round: i % 3 === 0 ? '50%' : '1px',
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

  // Confetti physics: seed one particle per pop element, then advance the
  // shared gravity/drag integrator each frame until every life is spent.
  useEffect(() => {
    if (!open) return undefined;
    if (document.documentElement.dataset.motionReduced === 'true') return undefined;

    const particles = pops.map((pop) => ({
      spec: createCurtainParticle(pop.dir),
      el: popRefs.current.get(pop.id),
    }));
    let alive = particles.length;
    let raf;

    const tick = () => {
      for (const p of particles) {
        if (p.spec.life <= 0) continue;
        if (!stepParticle(p.spec)) {
          p.spec.life = 0;
          alive -= 1;
          if (p.el) p.el.style.opacity = '0';
          continue;
        }
        if (p.el) {
          p.el.style.transform = `translate(${p.spec.x}px, ${p.spec.y}px) rotate(${p.spec.rot}deg)`;
          p.el.style.opacity = String(Math.min(1, p.spec.life * 1.4));
        }
      }
      if (alive > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, pops]);

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
              ref={(el) => popRefs.current.set(pop.id, el)}
              className="site-curtain-pop"
              style={{
                left: pop.left,
                width: `${pop.size}px`,
                height: `${pop.size}px`,
                borderRadius: pop.round,
                backgroundColor: pop.color,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
