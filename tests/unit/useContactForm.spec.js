import { describe, it, expect } from 'vitest';
import { resolveSendChannel, buildMailtoHref } from '../../src/hooks/useContactForm.js';

const KEYS = {
  serviceId: 'svc_1',
  templateId: 'tpl_1',
  publicKey: 'pub_1',
};

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
