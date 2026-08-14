import { useEffect, useRef, useCallback } from 'react';
import FocesLogo from '../../assets/FOCES White.svg';
import '../AboutUs/AboutUs.css';
import useDeviceProfile from '../../hooks/useLowPower.js';
import { scheduleBackgroundTask } from '../../utils/priorityScheduler.js';
import {
  registerWidget,
  markInteracted,
  getArrowOwner,
  isControlFocused,
  rectIsOnScreen,
} from '../../utils/keyboardLock.js';
import { createSpinTracker, SPIN_BARS } from './easterEggLogic.js';
import {
  CUBE_PHYSICS,
  snapAngle,
  windStepVelocity,
  isWindStopped,
  resolveWindDown,
} from './cubePhysics.js';
import {
  TOAST_MS,
  MAX_TOASTS,
  pickEasterMessage,
  pushToast,
  emaVelocity,
} from './easterEggCelebration.js';
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
const SPIN_CONFIG = TOUCH_FIRST ? SPIN_BARS.touch : SPIN_BARS.desktop;
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
  const { lowPower, slowNetwork } = useDeviceProfile();
  const boxRef = useRef(null);
  const rotXRef = useRef(0);
  const rotYRef = useRef(0);

  // Drag state
  const startX = useRef(0);
  const startRotY = useRef(0);
  const lastMove = useRef({ t: 0, y: 0 });
  const velY = useRef(0); // deg/ms while dragging, deg/frame during wind-down
  const isDraggingRef = useRef(false);

  // Wind-down / auto-rotation
  const windingRef = useRef(false);
  const windRaf = useRef(null);
  const confettiRaf = useRef(null);
  const manualUntilRef = useRef(0);

  // Easter-egg tracking (sequence logic in easterEggLogic.js)
  const spinTrackerRef = useRef(createSpinTracker(SPIN_CONFIG));
  const accumAngleRef = useRef(0);
  const lastToastRef = useRef('');

  const applyTransform = useCallback(() => {
    if (!boxRef.current) return;
    boxRef.current.style.transform = `rotateX(${rotXRef.current}deg) rotateY(${rotYRef.current}deg)`;
  }, []);

  const triggerEasterEgg = useCallback(() => {
    const wrap = document.getElementById('mainDiv-about');
    if (!wrap) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Clean up any previous burst
    wrap.querySelectorAll('.about-burst').forEach((n) => n.remove());
    wrap.classList.remove('about-wobble');

    // Celebratory wobble (on the wrapper, so it never fights the cube's inline rotate)
    if (!reduceMotion) {
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
    if (reduceMotion) return;

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

      const count = lowPower ? 10 : 30;
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
  }, [lowPower]);

  // Register one manual spin; fires the easter egg after the rapid-spin bar.
  const registerSpin = useCallback(() => {
    if (spinTrackerRef.current.register()) triggerEasterEgg();
  }, [triggerEasterEgg]);

  // Accumulate horizontal (Y-axis) angular travel; every full 90° = one spin.
  const accumulateAngle = useCallback(
    (deg) => {
      accumAngleRef.current += deg;
      while (accumAngleRef.current >= 90) {
        accumAngleRef.current -= 90;
        registerSpin();
      }
    },
    [registerSpin],
  );

  // Settle the cube onto the nearest 90° face with a smooth, slow transition.
  const snapToFace = useCallback(() => {
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
    const el = boxRef.current;
    if (!el) return;
    const tx = snapAngle(rotXRef.current);
    const ty = snapAngle(rotYRef.current);
    el.style.transition = `transform ${CUBE_PHYSICS.snapMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    rotXRef.current = tx;
    rotYRef.current = ty;
    applyTransform();
    setTimeout(() => {
      if (boxRef.current) boxRef.current.style.transition = 'none';
    }, CUBE_PHYSICS.snapMs);
    manualUntilRef.current = Date.now() + 1200;
  }, [applyTransform]);

  // Release "inertia": keep rotating with the release velocity, decaying, until
  // it's slow enough to settle onto a face. Rapid spins decay slower for a longer glide.
  const startWindDown = useCallback(
    (friction = CUBE_PHYSICS.normalWindFriction) => {
      windingRef.current = true;
      manualUntilRef.current = Date.now() + 10000;
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
      const step = () => {
        // Y-axis only — spin decays on the horizontal plane. Inertia spins do
        // NOT count toward the easter egg; only deliberate drags/keys do.
        rotYRef.current += velY.current;
        velY.current = windStepVelocity(velY.current, friction);
        if (isWindStopped(velY.current)) {
          snapToFace();
          return;
        }
        applyTransform();
        windRaf.current = requestAnimationFrame(step);
      };
      windRaf.current = requestAnimationFrame(step);
    },
    [applyTransform, snapToFace],
  );

  const stopWindDown = useCallback(() => {
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
  }, []);

  // Smooth 60fps direct-DOM auto-rotation when idle (pauses while offscreen).
  useEffect(() => {
    if (lowPower || slowNetwork) return;

    let animFrame = null;
    let visible = true;
    let observer = null;

    const animate = () => {
      if (
        visible &&
        !isDraggingRef.current &&
        !windingRef.current &&
        Date.now() >= manualUntilRef.current
      ) {
        const el = boxRef.current;
        if (el) {
          // Left/right spin only — no X-axis wobble. Turns the same way
          // ArrowRight does (rightward) for consistency.
          rotYRef.current = (rotYRef.current - 0.5 + 360) % 360;
          el.style.transition = 'none';
          el.style.transform = `rotateX(0deg) rotateY(${rotYRef.current}deg)`;
        }
      }
      if (visible) {
        animFrame = requestAnimationFrame(animate);
      } else {
        animFrame = null;
      }
    };

    if (typeof IntersectionObserver === 'function' && boxRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible && animFrame == null) animFrame = requestAnimationFrame(animate);
        },
        { rootMargin: '100px' },
      );
      observer.observe(boxRef.current);
    } else {
      visible = true;
    }

    if (visible && animFrame == null) animFrame = requestAnimationFrame(animate);

    return () => {
      if (animFrame != null) cancelAnimationFrame(animFrame);
      if (observer) observer.disconnect();
      stopWindDown();
    };
  }, [lowPower, slowNetwork, stopWindDown]);

  // Keyboard navigation — left/right arrows only (no vertical spin).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // Yield when a control has focus, or another on-screen widget owns the
      // arrows (last-interacted wins — see utils/keyboardLock.js).
      if (isControlFocused()) return;
      if (getArrowOwner() !== 'cube') return;
      const el = boxRef.current;
      if (!el) return;

      e.preventDefault();
      stopWindDown();
      el.style.transition = 'transform 0.4s ease-out';
      // ArrowRight turns the cube to the right (negative Y rotation).
      rotYRef.current += e.key === 'ArrowRight' ? -90 : 90;
      applyTransform();
      manualUntilRef.current = Date.now() + 3000;
      markInteracted('cube'); // arrow use keeps the cube's arrow ownership
      registerSpin();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [applyTransform, registerSpin, stopWindDown]);

  // Arrow-key arbitration (see utils/keyboardLock.js): register the cube as a
  // widget ("on screen" = the cube box is in the viewport) and mark it as the
  // last-interacted widget whenever the user presses/grabs it, so it claims
  // the arrow keys over any on-screen carousel.
  useEffect(() => {
    const unregister = registerWidget('cube', () => rectIsOnScreen(boxRef.current, 40));
    const wrap = document.getElementById('mainDiv-about');
    const mark = () => markInteracted('cube');
    wrap?.addEventListener('pointerdown', mark, true);
    return () => {
      unregister();
      wrap?.removeEventListener('pointerdown', mark, true);
    };
  }, []);

  // Own the touch gesture: once a drag starts on the cube, native scrolling
  // is suppressed for the rest of the gesture — rotating must never scroll
  // the page. This is belt-and-suspenders for old iOS that ignores
  // `touch-action` (see AboutUs.css); on modern browsers the CSS alone opts
  // the cube out of panning. Must be a NON-passive listener — React's
  // delegated touchmove is passive, so e.preventDefault() there would no-op.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const preventScroll = (e) => {
      if (isDraggingRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => el.removeEventListener('touchmove', preventScroll);
  }, []);

  // Cancel any wind-down / confetti rAF on unmount.
  useEffect(
    () => () => {
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
      if (confettiRaf.current != null) cancelAnimationFrame(confettiRaf.current);
    },
    [],
  );

  // ---- Shared drag helpers (touch + mouse) ----
  const beginDrag = useCallback((clientX) => {
    isDraggingRef.current = true;
    windingRef.current = false;
    if (windRaf.current != null) {
      cancelAnimationFrame(windRaf.current);
      windRaf.current = null;
    }
    startX.current = clientX;
    startRotY.current = rotYRef.current;
    lastMove.current = { t: Date.now(), y: rotYRef.current };
    velY.current = 0;
    manualUntilRef.current = Date.now() + 60000;
    if (boxRef.current) boxRef.current.style.transition = 'none';
  }, []);

  const moveDrag = useCallback(
    (clientX) => {
      if (!isDraggingRef.current) return;
      const now = Date.now();
      // Horizontal movement only — vertical drags are ignored (left/right
      // spin). Dragging right turns the cube right, matching ArrowRight.
      const ny = startRotY.current + (clientX - startX.current) * CUBE_PHYSICS.dragSensitivity;
      const dt = Math.max(now - lastMove.current.t, 1);
      velY.current = emaVelocity(velY.current, ny - lastMove.current.y, dt);
      accumulateAngle(Math.abs(ny - lastMove.current.y));
      lastMove.current = { t: now, y: ny };
      rotYRef.current = ny;
      applyTransform();
    },
    [accumulateAngle, applyTransform],
  );

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Resolve the release velocity into wind-down parameters (deg/ms ->
    // deg/frame, cap, rapid-vs-normal friction) — see cubePhysics.js.
    const resolved = resolveWindDown(velY.current);
    if (resolved) {
      velY.current = resolved.velocity;
      startWindDown(resolved.friction);
    } else {
      snapToFace();
    }
  }, [snapToFace, startWindDown]);

  // Touch handlers
  const handleTouchStart = (e) => {
    beginDrag(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    moveDrag(e.touches[0].clientX);
  };
  const handleTouchEnd = () => endDrag();

  // Mouse handlers. Move/up live on `window` so a fast drag keeps going past
  // the small cube bounds — otherwise the gesture dies at the box edge.
  const mouseHandlersRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    beginDrag(e.clientX);
    const move = (ev) => moveDrag(ev.clientX);
    const up = () => {
      endDrag();
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    mouseHandlersRef.current = { move, up };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  useEffect(
    () => () => {
      if (mouseHandlersRef.current) {
        window.removeEventListener('mousemove', mouseHandlersRef.current.move);
        window.removeEventListener('mouseup', mouseHandlersRef.current.up);
      }
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
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
