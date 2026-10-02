import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  pickEasterMessage,
  pushToast,
  fire,
  PARTICLE_COLORS,
  PARTICLE_EMOJIS,
} from '../../src/Components/AboutUs/easterEggCelebration.js';
import { randomUnit } from '../../src/utils/secureRandom.js';

// Particle creation branches on randomUnit(): every third particle becomes an
// emoji above a draw threshold, and both size bands are derived from it.
// Mocking it makes those branches and the size arithmetic assertable exactly,
// instead of only within a range.
vi.mock('../../src/utils/secureRandom.js', () => ({
  randomUnit: vi.fn(() => 0.1),
}));

// Fake timers must never outlive a test: under mutation testing the new
// cleanup assertion fails often, and a leaked fake-timer install makes every
// later test in the file hang until the 5s test timeout (noisy, slow runs).
afterEach(() => {
  vi.useRealTimers();
});

describe('pickEasterMessage', () => {
  const M = ['DARE to spin! 🎉', 'DOMINATE the cube! 🔥', 'Spin champion! 🌀'];
  it('picks different from previous', () => {
    let c = 0;
    const r = () => (c++ === 0 ? 0 : 1);
    expect(pickEasterMessage(M[0], M, r)).toBe(M[1]);
  });
  it('keeps first pick when already different', () => {
    expect(pickEasterMessage('Spin champion! 🌀', M, () => 0)).toBe(M[0]);
  });
  it('returns only message when single', () => {
    expect(pickEasterMessage('Solo 🎉', ['Solo 🎉'], () => 0)).toBe('Solo 🎉');
  });
  it('terminates with hostile rand', () => {
    expect(pickEasterMessage(M[0], M, () => 0)).toBe(M[1]);
  });
  it('wraps out-of-range rand', () => {
    expect(pickEasterMessage('DARE to spin! 🎉', M, () => 5)).toBe(M[2]);
  });
  it('returns when all identical', () => {
    expect(pickEasterMessage('Same 🎉', ['Same 🎉', 'Same 🎉'], () => 0)).toBe('Same 🎉');
  });
});

describe('pushToast', () => {
  it('appends toast and returns element', () => {
    const s = document.createElement('div');
    const t = pushToast(s, 'Hello', 4);
    expect(s.children).toHaveLength(1);
    expect(t.textContent).toBe('Hello');
  });
  it('drops oldest at capacity', () => {
    const s = document.createElement('div');
    const f = pushToast(s, 'A', 4);
    pushToast(s, 'B', 4);
    pushToast(s, 'C', 4);
    pushToast(s, 'D', 4);
    pushToast(s, 'E', 4);
    expect(s.children).toHaveLength(4);
    expect(f.isConnected).toBe(false);
    expect(s.textContent).toBe('BCDE');
  });
});

describe('fire — celebration trigger seam', () => {
  it('creates burst element inside parent', () => {
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    fire({
      cx: 100,
      cy: 200,
      count: 0,
      messages: ['A'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    });
    const b = p.querySelector('.about-burst');
    expect(b).not.toBeNull();
    expect(b.style.left).toBe('100px');
  });
  it('picks message and pushes toast', () => {
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    fire({
      cx: 0,
      cy: 0,
      count: 0,
      messages: ['Hello', 'World'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    });
    expect(s.children.length).toBe(1);
    expect(l).toBeTruthy();
  });
  it('spawns particles when count > 0', () => {
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    fire({
      cx: 0,
      cy: 0,
      count: 5,
      messages: ['X'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    });
    expect(
      p.querySelector('.about-burst').querySelectorAll('.about-particle, .about-particle--emoji')
        .length,
    ).toBe(5);
  });
  it('cleanup removes burst', () => {
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    const c = fire({
      cx: 0,
      cy: 0,
      count: 0,
      messages: ['X'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    });
    expect(p.querySelector('.about-burst')).not.toBeNull();
    c();
    expect(p.querySelector('.about-burst')).toBeNull();
  });
  it('cleanup removes the toast instead of leaving it to the stack', () => {
    vi.useFakeTimers();
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    const c = fire({
      cx: 0,
      cy: 0,
      count: 0,
      messages: ['X'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    });
    expect(s.querySelector('.about-toast')).not.toBeNull();
    c();
    // AboutUs runs this cleanup before firing the next celebration, so a
    // surviving toast would linger on screen until MAX_TOASTS evicted it.
    expect(s.querySelector('.about-toast')).toBeNull();
    // And its removal timer must not fire against the detached node.
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
  it('removes previous burst before creating new', () => {
    const p = document.createElement('div');
    const s = document.createElement('div');
    p.appendChild(s);
    let l = '';
    const o = {
      cx: 0,
      cy: 0,
      count: 0,
      messages: ['X'],
      stack: s,
      getLastToast: () => l,
      setLastToast: (m) => {
        l = m;
      },
    };
    fire(o);
    fire(o);
    expect(p.querySelectorAll('.about-burst').length).toBe(1);
  });

  // The particle DOM writes (class, colour, size, opacity, transform) are the
  // largest block of this module and were previously unasserted, so mutation
  // testing found most of them equivalent. Assert their contracts.
  describe('exported palette', () => {
    it('pins the burst colours', () => {
      expect(PARTICLE_COLORS).toEqual([
        '#22d3ee',
        '#a855f7',
        '#f472b6',
        '#facc15',
        '#4ade80',
        '#ffffff',
        '#fb7185',
        '#38bdf8',
      ]);
    });

    it('pins the burst emoji', () => {
      expect(PARTICLE_EMOJIS).toEqual(['✨', '🎉', '⭐', '🔥', '💥', '🚀']);
    });
  });

  describe('particles', () => {
    function burstWith(count) {
      const parent = document.createElement('div');
      const stack = document.createElement('div');
      parent.appendChild(stack);
      let last = '';
      const cleanup = fire({
        cx: 0,
        cy: 0,
        count,
        messages: ['X'],
        stack,
        getLastToast: () => last,
        setLastToast: (m) => {
          last = m;
        },
      });
      const burst = parent.querySelector('.about-burst');
      // Not every span in the burst is a particle: the burst also holds a
      // decorative .about-ring span.
      const particles = [...burst.querySelectorAll('.about-particle, .about-particle--emoji')];
      return { parent, burst, particles, cleanup };
    }

    it('creates exactly one element per requested particle', () => {
      expect(burstWith(7).particles).toHaveLength(7);
    });

    it('starts every particle transparent and scaled down', () => {
      const { particles, cleanup } = burstWith(6);
      for (const el of particles) {
        expect(el.style.opacity).toBe('0');
        expect(el.style.transform).toBe('translate(-50%, -50%) scale(0.1)');
      }
      cleanup();
    });

    it('turns every third particle into an emoji with the emoji size band', () => {
      // A 0.1 draw is below the 0.5 threshold, so every index divisible by 3
      // takes the emoji branch.
      randomUnit.mockReturnValue(0.1);
      const { particles, cleanup } = burstWith(7);
      particles.forEach((el, index) => {
        const isEmoji = index % 3 === 0;
        expect(el.className).toBe(
          isEmoji ? 'about-particle about-particle--emoji' : 'about-particle',
        );
        if (isEmoji) {
          expect(el.textContent).toBe(PARTICLE_EMOJIS[0]);
          // 16 + 0.1 * 14
          expect(el.style.getPropertyValue('--s')).toBe('17.4px');
          expect(el.style.getPropertyValue('--c')).toBe('');
        } else {
          expect(el.textContent).toBe('');
          expect(el.style.getPropertyValue('--c')).toBe(
            PARTICLE_COLORS[index % PARTICLE_COLORS.length],
          );
          // 6 + 0.1 * 9
          expect(el.style.getPropertyValue('--s')).toBe('6.9px');
        }
      });
      cleanup();
    });

    it('keeps every particle a dot when the draw is above the emoji threshold', () => {
      // 0.9 is at or above the threshold, so the emoji branch is unreachable
      // whatever the index is.
      randomUnit.mockReturnValue(0.9);
      const { particles, cleanup } = burstWith(6);
      for (const el of particles) {
        expect(el.className).toBe('about-particle');
        expect(el.textContent).toBe('');
        // 6 + 0.9 * 9
        expect(el.style.getPropertyValue('--s')).toBe('14.1px');
      }
      cleanup();
    });

    it('animates live particles and stops scheduling frames once they expire', async () => {
      const { parent, particles, cleanup } = burstWith(4);
      await new Promise((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => requestAnimationFrame(() => r()));

      const alive = particles.filter((el) => el.style.opacity !== '0');
      expect(alive.length).toBeGreaterThan(0);
      for (const el of alive) {
        expect(el.style.transform).toContain('translate(');
        expect(el.style.transform).toContain('px');
        expect(Number(el.style.opacity)).toBeGreaterThan(0);
      }

      // Long enough for every particle's life to be spent: the loop removes the
      // burst element and stops requesting frames.
      await new Promise((r) => setTimeout(r, 2500));
      expect(parent.querySelector('.about-burst')).toBeNull();
      cleanup();
    });
  });
});
