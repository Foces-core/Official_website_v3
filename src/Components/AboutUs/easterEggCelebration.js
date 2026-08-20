import { createParticleSpec, stepParticle } from './confettiSim.js';

// Celebration policies for the About cube easter egg — pure logic, no React.
//
// easterEggLogic.js owns the DETECTION; this module owns what happens when
// it does: message pick, capped toast, confetti burst, rAF loop.

export const TOAST_MS = 1700;
export const MAX_TOASTS = 4;

export const PARTICLE_COLORS = [
  '#22d3ee',
  '#a855f7',
  '#f472b6',
  '#facc15',
  '#4ade80',
  '#ffffff',
  '#fb7185',
  '#38bdf8',
];

export const PARTICLE_EMOJIS = ['✨', '🎉', '⭐', '🔥', '💥', '🚀'];

export function pickEasterMessage(last, messages, rand) {
  if (messages.length <= 1) return messages[0];
  const start = Math.floor(rand()) % messages.length;
  const offset = messages.findIndex((_, i) => messages[(start + i) % messages.length] !== last);
  if (offset === -1) return messages[start];
  return messages[(start + offset) % messages.length];
}

export function pushToast(stack, text, maxToasts = MAX_TOASTS) {
  while (stack.children.length >= maxToasts) {
    stack.firstChild.remove();
  }
  const toast = document.createElement('div');
  toast.className = 'about-toast';
  toast.textContent = text;
  stack.appendChild(toast);
  return toast;
}

/**
 * Fire the confetti celebration. Creates a burst element, spawns particles,
 * runs the rAF animation loop, picks and displays a toast message.
 *
 * @returns {() => void} cleanup — removes the burst element
 */
export function fire({
  cx,
  cy,
  count,
  colors = PARTICLE_COLORS,
  emojis = PARTICLE_EMOJIS,
  messages,
  stack,
  getLastToast,
  setLastToast,
}) {
  stack.parentElement?.querySelectorAll('.about-burst').forEach((n) => n.remove());

  const msg = pickEasterMessage(getLastToast(), messages, () =>
    Math.floor(Math.random() * messages.length),
  );
  setLastToast(msg);
  const toast = pushToast(stack, msg, MAX_TOASTS);
  setTimeout(() => toast.remove(), TOAST_MS);

  const burst = document.createElement('div');
  burst.className = 'about-burst';
  burst.style.left = `${cx}px`;
  burst.style.top = `${cy}px`;
  stack.parentElement?.appendChild(burst);

  const ring = document.createElement('span');
  ring.className = 'about-ring';
  burst.appendChild(ring);

  const particles = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    const useEmoji = i % 3 === 0 && Math.random() < 0.5;
    if (useEmoji) {
      el.className = 'about-particle about-particle--emoji';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.setProperty('--s', `${16 + Math.random() * 14}px`);
    } else {
      el.className = 'about-particle';
      el.style.setProperty('--c', colors[i % colors.length]);
      el.style.setProperty('--s', `${6 + Math.random() * 9}px`);
    }
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) scale(0.1)';
    particles.push({ el, ...createParticleSpec() });
    frag.appendChild(el);
  }
  burst.appendChild(frag);

  let rafId = null;
  const step = () => {
    let alive = false;
    for (const p of particles) {
      if (!stepParticle(p)) {
        p.el.style.opacity = '0';
        continue;
      }
      alive = true;
      p.el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${Math.max(0.2, p.life)})`;
      p.el.style.opacity = String(Math.min(1, p.life * 1.4));
    }
    if (alive) {
      rafId = requestAnimationFrame(step);
    } else {
      burst.remove();
      rafId = null;
    }
  };
  rafId = requestAnimationFrame(step);

  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    burst.remove();
  };
}
