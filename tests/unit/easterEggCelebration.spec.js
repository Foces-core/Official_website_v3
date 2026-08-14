import { describe, it, expect } from 'vitest';
import {
  pickEasterMessage,
  pushToast,
  emaVelocity,
} from '../../src/Components/AboutUs/easterEggCelebration.js';

// The cube easter egg's CELEBRATION policies (message no-repeat, toast-stack
// cap, drag-velocity EMA) used to be inline in AboutUs.jsx — detection is
// tested (easterEggLogic), the celebration was not.

describe('pickEasterMessage — no two identical toasts in a row', () => {
  const MESSAGES = ['DARE to spin! 🎉', 'DOMINATE the cube! 🔥', 'Spin champion! 🌀'];

  it('picks a message different from the previous one', () => {
    // rand sequence: first pick lands on MESSAGES[0], which IS the previous →
    // loop re-picks, landing on MESSAGES[1]
    let calls = 0;
    const rand = () => (calls++ === 0 ? 0 : 1);
    expect(pickEasterMessage(MESSAGES[0], MESSAGES, rand)).toBe(MESSAGES[1]);
  });

  it('keeps the first pick when it already differs from the previous', () => {
    const rand = () => 0;
    expect(pickEasterMessage('Spin champion! 🌀', MESSAGES, rand)).toBe(MESSAGES[0]);
  });

  it('returns the only message when there is nothing else to choose (no infinite loop)', () => {
    const rand = () => 0;
    expect(pickEasterMessage('Solo 🎉', ['Solo 🎉'], rand)).toBe('Solo 🎉');
  });
});

describe('pushToast — capped, oldest-first toast stack', () => {
  it('appends a toast and returns the new element', () => {
    const stack = document.createElement('div');
    const toast = pushToast(stack, 'DARE to spin! 🎉', 4);
    expect(stack.children).toHaveLength(1);
    expect(toast.className).toContain('about-toast');
    expect(toast.textContent).toBe('DARE to spin! 🎉');
  });

  it('drops the OLDEST toast when the stack is at capacity', () => {
    const stack = document.createElement('div');
    const first = pushToast(stack, 'A', 4);
    pushToast(stack, 'B', 4);
    pushToast(stack, 'C', 4);
    pushToast(stack, 'D', 4);
    const last = pushToast(stack, 'E', 4);
    expect(stack.children).toHaveLength(4);
    expect(first.isConnected).toBe(false); // oldest removed from the DOM
    expect(stack.textContent).toBe('BCDE'); // order preserved, newest last
    expect(last.textContent).toBe('E');
  });
});

describe('emaVelocity — exponential moving average of drag velocity', () => {
  it('mixes previous velocity with the instantaneous rate by the k factor', () => {
    // 10*(1-0.4) + (100/1)*0.4 = 6 + 40 = 46
    expect(emaVelocity(10, 100, 1)).toBeCloseTo(46);
  });

  it('decays toward zero when there is no movement', () => {
    // 10*(1-0.4) + 0 = 6 → repeated calls converge to 0
    let v = 10;
    for (let i = 0; i < 20; i += 1) v = emaVelocity(v, 0, 1);
    expect(v).toBeCloseTo(0);
  });

  it('accepts a custom k and guards against zero dt', () => {
    // custom k=1 → pure instantaneous rate
    expect(emaVelocity(10, 50, 1, 1)).toBe(50);
    // dt of 0 clamps to 1 (as the component does)
    expect(emaVelocity(10, 0, 0)).toBe(6);
  });
});
