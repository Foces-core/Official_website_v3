import { describe, it, expect } from 'vitest';
import {
  pickEasterMessage,
  pushToast,
  fire,
} from '../../src/Components/AboutUs/easterEggCelebration.js';

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
});
