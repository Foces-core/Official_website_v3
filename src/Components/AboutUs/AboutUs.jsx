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

// Easter egg: if the user spins the cube 20 times in RAPID succession (via
// keyboard arrows or a fast horizontal drag), a celebration fires. A spin =
// one 90° of Y rotation. A gap longer than RAPID_GAP between spins resets
// the counter, so casual rotating never triggers it — only deliberate rapid
// spinning. Wind-down inertia deliberately does NOT count: only spins the
// user actively drives. Hard to earn on purpose.
//
// On touch-first (mobile) devices the gesture is physically harder — the
// cube is small and every spin costs ~150px of finger travel — so the bar
// is eased a bit there (fewer spins + a wider reset gap). Desktop is
// unchanged. These constants are read once at module scope; the module is
// only ever evaluated on the client, so `window` is safe here.
const TOUCH_FIRST =
  typeof window !== 'undefined' &&
  window.matchMedia != null &&
  window.matchMedia('(pointer: coarse)').matches;
const RAPID_GAP = TOUCH_FIRST ? 1200 : 800;
const SPIN_TARGET = TOUCH_FIRST ? 15 : 20;
const TOAST_MS = 1700; // must outlast the .about-toast animation (1.6s)
const MAX_TOASTS = 4; // cap concurrent toasts during a rapid-fire session

// Drag + wind-down tuning
const DRAG_SENS = 0.6;
const NORMAL_WIND_FRICTION = 0.92; // per-frame velocity decay for normal spins — snappy stop
const RAPID_WIND_FRICTION = 0.975; // slower velocity decay for rapid spins — smooth long glide
const RAPID_SPEED_THRESHOLD = 2.5; // release speed (deg/frame) threshold to trigger rapid wind-down
const NORMAL_MAX_WIND_SPEED = 4; // deg/frame cap for normal spins
const RAPID_MAX_WIND_SPEED = 9; // deg/frame cap for rapid spins
const MIN_WIND_SPEED = 0.05; // deg/frame — below this the cube snaps to a face
const SNAP_MS = 400; // how long the settle-to-face animation takes

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
  `${SPIN_TARGET} spins? You DEVELOP-ded that. 😎`,
  'DOMINATE the cube! 🔥',
  'You FOCES-inated the cube ✨',
  'Spin champion! 🌀',
  'The cube is dizzy now! 😵‍💫',
  'Rapid-fire spinner! ⚡',
  `${SPIN_TARGET} spins? The cube can't keep up! 💫`,
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

  // Easter-egg tracking
  const spinCountRef = useRef(0);
  const lastSpinRef = useRef(0);
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
    while (stack.children.length >= MAX_TOASTS) {
      stack.firstChild.remove(); // drop the oldest first so the pile stays small
    }
    const toast = document.createElement('div');
    toast.className = 'about-toast';
    // Never show the same message twice in a row (random, no repeat-until-different).
    let msg;
    do {
      msg = EASTER_MESSAGES[Math.floor(Math.random() * EASTER_MESSAGES.length)];
    } while (msg === lastToastRef.current && EASTER_MESSAGES.length > 1);
    lastToastRef.current = msg;
    toast.textContent = msg;
    stack.appendChild(toast);
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
        particles.push({
          el: p,
          x: 0,
          y: 0,
          vx: (Math.random() - 0.5) * 6,
          vy: -(2.5 + Math.random() * 5),
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 22,
          life: 1,
          decay: 0.012 + Math.random() * 0.008,
        });
        frag.appendChild(p);
      }
      burst.appendChild(frag);

      // 60fps loop: gravity pulls the confetti down while it drifts, spins and fades.
      const step = () => {
        let alive = false;
        for (const p of particles) {
          p.vy += 0.16;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          p.life -= p.decay;
          if (p.life <= 0) {
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

  // Register one manual spin; fires the easter egg after SPIN_TARGET rapid spins.
  const registerSpin = useCallback(() => {
    const now = Date.now();
    spinCountRef.current = now - lastSpinRef.current > RAPID_GAP ? 1 : spinCountRef.current + 1;
    lastSpinRef.current = now;
    if (spinCountRef.current >= SPIN_TARGET) {
      spinCountRef.current = 0;
      triggerEasterEgg();
    }
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
    const tx = Math.round(rotXRef.current / 90) * 90;
    const ty = Math.round(rotYRef.current / 90) * 90;
    el.style.transition = `transform ${SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    rotXRef.current = tx;
    rotYRef.current = ty;
    applyTransform();
    setTimeout(() => {
      if (boxRef.current) boxRef.current.style.transition = 'none';
    }, SNAP_MS);
    manualUntilRef.current = Date.now() + 1200;
  }, [applyTransform]);

  // Release "inertia": keep rotating with the release velocity, decaying, until
  // it's slow enough to settle onto a face. Rapid spins decay slower for a longer glide.
  const startWindDown = useCallback(
    (friction = NORMAL_WIND_FRICTION) => {
      windingRef.current = true;
      manualUntilRef.current = Date.now() + 10000;
      if (windRaf.current != null) cancelAnimationFrame(windRaf.current);
      const step = () => {
        // Y-axis only — spin decays on the horizontal plane. Inertia spins do
        // NOT count toward the easter egg; only deliberate drags/keys do.
        rotYRef.current += velY.current;
        velY.current *= friction;
        const speed = Math.abs(velY.current);
        if (speed < MIN_WIND_SPEED) {
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
      const ny = startRotY.current + (clientX - startX.current) * DRAG_SENS;
      const dt = Math.max(now - lastMove.current.t, 1);
      const k = 0.4;
      velY.current = velY.current * (1 - k) + ((ny - lastMove.current.y) / dt) * k;
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

    // Convert release velocity from deg/ms to deg/frame, cap it, then wind down.
    // Rapid spins use a higher speed cap and a slower decay (friction) for an elegant long glide.
    const vy = velY.current * (1000 / 60);
    const speed = Math.abs(vy);
    if (speed > 0.05) {
      const isRapid = speed >= RAPID_SPEED_THRESHOLD;
      const maxSpeed = isRapid ? RAPID_MAX_WIND_SPEED : NORMAL_MAX_WIND_SPEED;
      const friction = isRapid ? RAPID_WIND_FRICTION : NORMAL_WIND_FRICTION;
      const s = Math.min(speed, maxSpeed) / speed;
      velY.current = vy * s;
      startWindDown(friction);
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
