import { useRef, useCallback, useEffect } from 'react';
import FocesLogo from '../../assets/FOCES White.svg';
import '../AboutUs/AboutUs.css';
import useExperienceCapabilities from '../../hooks/useExperienceCapabilities.js';
import { useCubeDrag } from '../../hooks/useCubeDrag.js';
import { scheduleBackgroundTask } from '../../utils/priorityScheduler.js';
import { spinConfigFor } from './easterEggLogic.js';
import { TOAST_MS, MAX_TOASTS, pickEasterMessage, pushToast } from './easterEggCelebration.js';
import { createParticleSpec, stepParticle } from './confettiSim.js';

// Easter egg: if the user spins the cube rapidly (via keyboard arrows or a
// fast horizontal drag), a celebration fires. A spin = one 90° of Y rotation.
// A gap longer than the reset window between spins resets the counter, so
// casual rotating never triggers it — only deliberate rapid spinning.
// Wind-down inertia deliberately does NOT count: only spins the user
// actively drives. Hard to earn on purpose.
//
// On touch-first (mobile) devices the gesture is physically harder — the
// cube is small and every spin costs ~150px of finger travel — so the bar
// is eased there (SPIN_BARS.touch vs SPIN_BARS.desktop in easterEggLogic.js,
// the single source of truth). The counting logic lives in that module too
// (pure, unit-tested); the pick is read once at module scope (client-only,
// so `window` is safe).
const TOUCH_FIRST =
  typeof window !== 'undefined' &&
  window.matchMedia != null &&
  window.matchMedia('(pointer: coarse)').matches;
// The policy pick (which bar applies) lives in easterEggLogic.js — pure,
// unit-tested; only the DOM read stays here.
const SPIN_CONFIG = spinConfigFor(TOUCH_FIRST);
// Drag + wind-down tuning lives in cubePhysics.js (pure, unit-tested); the
// celebration policies (message pick, toast cap, velocity EMA) live in
// easterEggCelebration.js — both used to sit here untested.

const PARTICLE_COLORS = [
  '#22d3ee',
  '#a855f7',
  '#f472b6',
  '#facc15',
  '#4ade80',
  '#ffffff',
  '#fb7185',
  '#38bdf8',
];
const PARTICLE_EMOJIS = ['✨', '🎉', '⭐', '🔥', '💥', '🚀'];
const EASTER_MESSAGES = [
  'DARE to spin! 🎉',
  `${SPIN_CONFIG.target} spins? You DEVELOP-ded that. 😎`,
  'DOMINATE the cube! 🔥',
  'You FOCES-inated the cube ✨',
  'Spin champion! 🌀',
  'The cube is dizzy now! 😵‍💫',
  'Rapid-fire spinner! ⚡',
  `${SPIN_CONFIG.target} spins? The cube can't keep up! 💫`,
  'All spins, no glitches — clean code! 🧹',
  'You spin me right round! 💿',
  'The cube bows to you. 🙇',
  'Peak FOCES performance! 🏆',
];

function AboutUs() {
  // The lowPower/slowNetwork/reducedMotion dialects live in the
  // experience-tier matrix (utils/experienceTier.js): the cube's idle
  // auto-spin (idleSpin), the celebration's wobble/confetti (celebrationMotion)
  // and the confetti particle budget (confetti) are read as capabilities.
  const { idleSpin, confetti, celebrationMotion } = useExperienceCapabilities();
  const confettiRaf = useRef(null);
  const lastToastRef = useRef('');

  // The celebration reads boxRef, which the hook owns — forward the egg fire
  // through a ref (the hook also keeps onEggFire in a ref, so the wiring
  // stays stable across celebration re-creates).
  const triggerEggRef = useRef(() => {});
  const { boxRef, handlers } = useCubeDrag({
    idleSpin,
    spinConfig: SPIN_CONFIG,
    onEggFire: () => triggerEggRef.current(),
  });

  const triggerEasterEgg = useCallback(() => {
    const wrap = document.getElementById('mainDiv-about');
    if (!wrap) return;

    // Clean up any previous burst
    wrap.querySelectorAll('.about-burst').forEach((n) => n.remove());
    wrap.classList.remove('about-wobble');

    // Celebratory wobble (on the wrapper, so it never fights the cube's inline rotate)
    if (celebrationMotion) {
      wrap.classList.add('about-wobble');
      setTimeout(() => wrap.classList.remove('about-wobble'), 1000);
    }

    // Toast message (always shown, cheap). Toasts are appended to a
    // bottom-anchored stack so rapid successes pile up vertically (newest
    // spawns at the bottom, older ones are pushed up) instead of overlapping.
    let stack = wrap.querySelector('.about-toasts');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'about-toasts';
      wrap.appendChild(stack);
    }
    // Never show the same message twice in a row (no-repeat pick + capped
    // stack live in easterEggCelebration.js — pure, unit-tested).
    lastToastRef.current = pickEasterMessage(lastToastRef.current, EASTER_MESSAGES, () =>
      Math.floor(Math.random() * EASTER_MESSAGES.length),
    );
    const toast = pushToast(stack, lastToastRef.current, MAX_TOASTS);
    setTimeout(() => toast.remove(), TOAST_MS);

    // Confetti burst + shockwave ring: scheduled with lowest background priority
    // so celebration animations never block core thread tasks.
    if (!celebrationMotion) return;

    scheduleBackgroundTask(() => {
      const box = boxRef.current;
      const wrapRect = wrap.getBoundingClientRect();
      if (!box || !wrapRect) return;
      const boxRect = box.getBoundingClientRect();
      const cx = boxRect.left + boxRect.width / 2 - wrapRect.left;
      const cy = boxRect.top + boxRect.height / 2 - wrapRect.top;

      const burst = document.createElement('div');
      burst.className = 'about-burst';
      burst.style.left = `${cx}px`;
      burst.style.top = `${cy}px`;
      wrap.appendChild(burst);

      // Expanding shockwave ring from the cube's center.
      const ring = document.createElement('span');
      ring.className = 'about-ring';
      burst.appendChild(ring);

      const count = confetti ? 30 : 10;
      const particles = [];
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        const emoji = i % 3 === 0 && Math.random() < 0.5;
        if (emoji) {
          p.className = 'about-particle about-particle--emoji';
          p.textContent = PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)];
          p.style.setProperty('--s', `${16 + Math.random() * 14}px`);
        } else {
          p.className = 'about-particle';
          p.style.setProperty('--c', PARTICLE_COLORS[i % PARTICLE_COLORS.length]);
          p.style.setProperty('--s', `${6 + Math.random() * 9}px`);
        }
        // Hidden until the first physics frame so nothing flashes at the origin.
        p.style.opacity = '0';
        p.style.transform = 'translate(-50%, -50%) scale(0.1)';
        particles.push({ el: p, ...createParticleSpec() });
        frag.appendChild(p);
      }
      burst.appendChild(frag);

      // 60fps loop: gravity pulls the confetti down while it drifts, spins and fades.
      // The per-frame math lives in confettiSim.js; only the DOM writes stay here.
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
          confettiRaf.current = requestAnimationFrame(step);
        } else {
          burst.remove();
          confettiRaf.current = null;
        }
      };
      confettiRaf.current = requestAnimationFrame(step);
    });
  }, [confetti, celebrationMotion, boxRef]);

  useEffect(() => {
    triggerEggRef.current = triggerEasterEgg;
  }, [triggerEasterEgg]);

  // Cancel any in-flight confetti rAF on unmount (wind-down rAF is owned by
  // the useCubeDrag hook).
  useEffect(
    () => () => {
      if (confettiRaf.current != null) cancelAnimationFrame(confettiRaf.current);
    },
    [],
  );

  return (
    <div
      className="mx-6 mt-14 lg:mx-1 flex flex-col justify-center text-white lg:px-44 scroll-mt-24"
      id="about"
    >
      <div className="md:text-xl lg:text-2xl mb-4 md:mb-6 lg:mb-8 flex items-center relative">
        <div className="inline-block w-5 h-16 bg-[#4f4f54] relative" data-aos="flip-up"></div>
        <h2
          className="absolute pl-3.5 flex items-center gap-2 sm:gap-3 select-none"
          data-aos="flip-up"
          data-aos-duration="750"
        >
          <span className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase">
            WHY
          </span>
          <img
            src={FocesLogo}
            alt="FOCES"
            loading="lazy"
            decoding="async"
            className="h-6 sm:h-8 md:h-9 w-auto inline-block filter drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          />
          <span className="text-white font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-wider">
            ?
          </span>
        </h2>
      </div>

      <div className="flex flex-col items-center justify-center container-about">
        <div
          className="sm:text-[14px] md:text-[17px] text-center"
          data-aos="zoom-in"
          data-aos-duration="1000"
        >
          <p className="font-about">
            The Forum of Computer Engineering Students (FOCES) at the College of Engineering
            Chengannur aims to uplift the skills of the student community. Guided by the visionary
            ethos of &quot;DARE, DEVELOP, and DOMINATE,&quot; the forum offers opportunities for
            students to help each other achieve excellence and reach the pinnacle of success.
            Through various workshops, hackathons, and seminars, FOCES provides a platform for
            students to enhance their technical skills and knowledge. The forum encourages
            collaboration and innovation, fostering a spirit of teamwork and creativity.
          </p>
        </div>

        <div id="mainDiv-about" className="select-none cursor-grab active:cursor-grabbing">
          <div
            id="boxDiv-about"
            ref={boxRef}
            {...handlers}
            role="group"
            tabIndex={0}
            aria-label="FOCES values cube, spin it left or right with the arrow keys or by dragging horizontally"
          >
            <div id="front-about" className="font-about text-shadow-white">
              DARE
            </div>
            <div id="back-about" className="font-about text-shadow-white">
              DEVELOP
            </div>
            <div id="left-about" className="font-about text-shadow-white">
              DOMINATE
            </div>
            <div id="right-about" className="font-about text-shadow-white">
              FOCES
            </div>
            <div id="top-about" className="font-about text-shadow-white">
              ICFOSS
            </div>
            <div id="bottom-about" className="font-about text-shadow-white">
              CEC
            </div>

            <div className="shadow-about"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
