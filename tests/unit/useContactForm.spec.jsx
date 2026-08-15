import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import useContactForm, {
  resolveSendChannel,
  buildMailtoHref,
} from '../../src/hooks/useContactForm.js';
import { createHarness } from './harness.jsx';

// The hook's send flow talks to EmailJS and react-toastify; mock both so the
// channel decision, validation gate, and fallbacks are testable in isolation.
vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn() },
}));
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn(), dismiss: vi.fn() },
}));

import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';

const KEYS = {
  serviceId: 'svc_1',
  templateId: 'tpl_1',
  publicKey: 'pub_1',
};

const VALID_VALUES = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  subject: 'Hello',
  message: 'Nice site!',
};

const EMPTY_VALUES = { name: '', email: '', subject: '', message: '' };

// The seam is the hook's public interface, observed through a probe that
// renders it into the DOM (same pattern as useLowPower.spec.jsx): the test
// drives the form like a user and reads the rendered state back.
function Probe() {
  const { values, setField, submit, isSubmitting } = useContactForm();
  return (
    <form>
      <input name="name" onChange={setField} />
      <input name="email" onChange={setField} />
      <input name="subject" onChange={setField} />
      <textarea name="message" onChange={setField} />
      <output id="values">{JSON.stringify(values)}</output>
      <output id="submitting">{String(isSubmitting)}</output>
      <button type="submit" id="submit-btn" onClick={(e) => submit(e)}>
        Send
      </button>
    </form>
  );
}

let harness;
let container;

function type(name, value) {
  const el = container.querySelector(`[name="${name}"]`);
  const proto =
    el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function fill(values = VALID_VALUES) {
  for (const [name, value] of Object.entries(values)) type(name, value);
}

async function clickSubmit() {
  await act(async () => {
    container.querySelector('#submit-btn').click();
  });
}

const readValues = () => JSON.parse(container.querySelector('#values').textContent);
const readSubmitting = () => container.querySelector('#submitting').textContent;

// The mailto fallback launches the native mail app by creating an <a> and
// clicking it. Spy on the click so jsdom never attempts a real navigation
// (noisy "Not implemented: navigation" stderr), and so the launch seam is
// assertable: the clicked anchor must point at the FOCES inbox.
let mailtoClick;

beforeEach(() => {
  harness = createHarness();
  container = harness.container;
  vi.clearAllMocks();
  mailtoClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'svc_1');
  vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'tpl_1');
  vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'pub_1');
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  harness.render(<Probe />);
});

afterEach(() => {
  harness.unmount();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('resolveSendChannel', () => {
  it('uses EmailJS when online and all keys are configured', () => {
    expect(resolveSendChannel({ onLine: true, ...KEYS })).toBe('emailjs');
  });

  it('falls back to mailto when offline', () => {
    expect(resolveSendChannel({ onLine: false, ...KEYS })).toBe('mailto');
  });

  it('falls back to mailto when any EmailJS key is missing', () => {
    expect(resolveSendChannel({ onLine: true, ...KEYS, serviceId: '' })).toBe('mailto');
    expect(resolveSendChannel({ onLine: true, ...KEYS, templateId: undefined })).toBe('mailto');
    expect(resolveSendChannel({ onLine: true, ...KEYS, publicKey: null })).toBe('mailto');
  });

  it('falls back to mailto when offline AND keys are missing', () => {
    expect(
      resolveSendChannel({ onLine: false, serviceId: '', templateId: '', publicKey: '' }),
    ).toBe('mailto');
  });
});

describe('buildMailtoHref', () => {
  const values = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Hi & bye',
    message: 'Hello\nWorld',
  };

  it('builds a mailto href to the FOCES inbox', () => {
    expect(buildMailtoHref(values)).toMatch(/^mailto:Sebinmathew543@gmail\.com\?/);
  });

  it('URL-encodes the subject and body', () => {
    const href = buildMailtoHref(values);
    expect(href).toContain(`subject=${encodeURIComponent('Hi & bye')}`);
    expect(href).toContain(
      `body=${encodeURIComponent('Name: Ada Lovelace\nEmail: ada@example.com\n\nMessage:\nHello\nWorld')}`,
    );
  });

  it('handles apostrophes and unicode', () => {
    const href = buildMailtoHref({ ...values, name: "O'Brien", message: 'नमस्ते' });
    expect(href).toContain(encodeURIComponent("Name: O'Brien"));
    expect(href).toContain(encodeURIComponent('नमस्ते'));
  });
});

describe('useContactForm submit flow', () => {
  it('rejects an invalid form with a toast and never touches EmailJS', async () => {
    fill({ ...VALID_VALUES, email: 'not-an-email' });
    await clickSubmit();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(emailjs.send).not.toHaveBeenCalled();
    expect(readSubmitting()).toBe('false');
  });

  it('sends via EmailJS when online with keys, resets the form, and toasts success', async () => {
    emailjs.send.mockResolvedValue({});
    fill();
    await clickSubmit();
    expect(emailjs.send).toHaveBeenCalledTimes(1);
    expect(emailjs.send.mock.calls[0][0]).toBe('svc_1');
    expect(emailjs.send.mock.calls[0][1]).toBe('tpl_1');
    expect(emailjs.send.mock.calls[0][2]).toMatchObject({
      name: 'Ada Lovelace',
      from_name: 'Ada Lovelace',
      email: 'ada@example.com',
      from_email: 'ada@example.com',
      reply_to: 'ada@example.com',
      subject: 'Hello',
      message: 'Nice site!',
    });
    expect(emailjs.send.mock.calls[0][3]).toBe('pub_1');
    expect(toast.success).toHaveBeenCalledWith('Message sent successfully!', expect.anything());
    expect(mailtoClick).not.toHaveBeenCalled();
    expect(readValues()).toEqual(EMPTY_VALUES);
    expect(readSubmitting()).toBe('false');
  });

  it('falls back to mailto when offline: no EmailJS call, offline toast, values kept', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    fill();
    await clickSubmit();
    expect(emailjs.send).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      'You are offline. Opening email app...',
      expect.anything(),
    );
    expect(mailtoClick).toHaveBeenCalledTimes(1);
    expect(mailtoClick.mock.instances[0].href).toMatch(/^mailto:Sebinmathew543@gmail\.com\?/);
    expect(readValues()).toEqual(VALID_VALUES);
    expect(readSubmitting()).toBe('false');
  });

  it('falls back to mailto when a key is missing even though online', async () => {
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', '');
    fill();
    await clickSubmit();
    expect(emailjs.send).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      'Opening your email app to send message...',
      expect.anything(),
    );
    expect(mailtoClick).toHaveBeenCalledTimes(1);
    expect(readSubmitting()).toBe('false');
  });

  it('falls back to mailto when EmailJS rejects, keeping the entered values', async () => {
    emailjs.send.mockRejectedValue(new Error('network down'));
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fill();
    await clickSubmit();
    expect(logError).toHaveBeenCalledWith('EmailJS send error:', expect.any(Error));
    logError.mockRestore();
    expect(emailjs.send).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(
      'Opening your email app to send message...',
      expect.anything(),
    );
    expect(mailtoClick).toHaveBeenCalledTimes(1);
    expect(readValues()).toEqual(VALID_VALUES);
    expect(readSubmitting()).toBe('false');
  });

  it('ignores a second submit while one is in flight (isSubmitting guard)', async () => {
    let resolveSend;
    emailjs.send.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );
    fill();
    act(() => {
      container.querySelector('#submit-btn').click();
    });
    act(() => {
      container.querySelector('#submit-btn').click();
    });
    expect(emailjs.send).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveSend({});
    });
    expect(readSubmitting()).toBe('false');
  });
});
