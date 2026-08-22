import { useRef, useCallback, useEffect } from 'react';
import FocesLogo from '../../assets/FOCES White.svg';
import '../AboutUs/AboutUs.css';
import useExperienceCapabilities from '../../hooks/useExperienceCapabilities.js';
import { useCubeDrag } from '../../hooks/useCubeDrag.js';
import { scheduleBackgroundTask } from '../../utils/priorityScheduler.js';
import { spinConfigFor } from './easterEggLogic.js';
import { fire, PARTICLE_COLORS, PARTICLE_EMOJIS } from './easterEggCelebration.js';

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
  const celebrationCleanupRef = useRef(null);
  const lastToastRef = useRef('');

  // The celebration reads boxRef, which the hook owns — forward the egg fire
  // through a ref (the hook also keeps onEggFire in a ref, so the wiring
  // stays stable across celebration re-creates).
  const triggerEggRef = useRef(() => {});
  const cubeWrapRef = useRef(null);
  const { boxRef, handlers } = useCubeDrag({
    idleSpin,
    spinConfig: SPIN_CONFIG,
    onEggFire: () => triggerEggRef.current(),
    wrapRef: cubeWrapRef,
  });

  const triggerEasterEgg = useCallback(() => {
    const wrap = cubeWrapRef.current;
    if (!wrap) return;

    wrap.querySelectorAll('.about-burst').forEach((n) => n.remove());
    wrap.classList.remove('about-wobble');

    // Celebratory wobble (on the wrapper, so it never fights the cube's inline rotate)
    if (celebrationMotion) {
      wrap.classList.add('about-wobble');
      setTimeout(() => wrap.classList.remove('about-wobble'), 1000);
    }

    let stack = wrap.querySelector('.about-toasts');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'about-toasts';
      wrap.appendChild(stack);
    }

    celebrationCleanupRef.current?.();
    celebrationCleanupRef.current = null;

    // fire() owns message pick, toast, particles, rAF — all spec-guarded.
    scheduleBackgroundTask(() => {
      const box = boxRef.current;
      if (!box) return;
      const wrapRect = wrap.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const cx = boxRect.left + boxRect.width / 2 - wrapRect.left;
      const cy = boxRect.top + boxRect.height / 2 - wrapRect.top;

      celebrationCleanupRef.current = fire({
        cx,
        cy,
        count: confetti ? (celebrationMotion ? 30 : 0) : 10,
        colors: PARTICLE_COLORS,
        emojis: PARTICLE_EMOJIS,
        messages: EASTER_MESSAGES,
        stack,
        getLastToast: () => lastToastRef.current,
        setLastToast: (m) => {
          lastToastRef.current = m;
        },
      });
    });
  }, [confetti, celebrationMotion, boxRef]);

  useEffect(() => {
    triggerEggRef.current = triggerEasterEgg;
  }, [triggerEasterEgg]);

  useEffect(() => () => celebrationCleanupRef.current?.(), []);

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

        <div
          ref={cubeWrapRef}
          id="mainDiv-about"
          className="select-none cursor-grab active:cursor-grabbing"
        >
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
