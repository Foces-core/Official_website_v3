import { describe, it, expect, vi } from 'vitest';
import {
  CONTACT_EMAIL,
  resolveSendChannel,
  buildMailtoHref,
  resolveSubmissionOutcome,
} from '../../src/utils/contactSubmitLogic.js';

describe('contactSubmitLogic pure outcome resolver', () => {
  it('defines the canonical club contact email', () => {
    expect(CONTACT_EMAIL).toBe('Sebinmathew543@gmail.com');
  });

  describe('resolveSendChannel', () => {
    it('resolves mailto when offline or keys missing', () => {
      expect(
        resolveSendChannel({ onLine: false, serviceId: 's', templateId: 't', publicKey: 'p' }),
      ).toBe('mailto');
      expect(
        resolveSendChannel({ onLine: true, serviceId: '', templateId: 't', publicKey: 'p' }),
      ).toBe('mailto');
      expect(
        resolveSendChannel({ onLine: true, serviceId: 's', templateId: '', publicKey: 'p' }),
      ).toBe('mailto');
      expect(
        resolveSendChannel({ onLine: true, serviceId: 's', templateId: 't', publicKey: '' }),
      ).toBe('mailto');
    });

    it('resolves emailjs when online with all 3 keys present', () => {
      expect(
        resolveSendChannel({ onLine: true, serviceId: 's', templateId: 't', publicKey: 'p' }),
      ).toBe('emailjs');
    });
  });

  describe('buildMailtoHref', () => {
    it('constructs encoded mailto URL with subject and body', () => {
      const href = buildMailtoHref({
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'Hello FOCES',
        message: 'Excited for the hackathon!',
      });

      expect(href).toContain('mailto:Sebinmathew543@gmail.com');
      expect(href).toContain('subject=Hello%20FOCES');
      expect(href).toContain('body=Name%3A%20Alice');
    });
  });

  describe('resolveSubmissionOutcome 5-branch resolution', () => {
    const validValues = {
      name: 'Bob',
      email: 'bob@example.com',
      subject: 'Inquiry',
      message: 'Great website!',
      website: '',
    };

    it('Branch 1: returns spam-fake-success when honeypot is populated', async () => {
      const outcome = await resolveSubmissionOutcome({
        values: { ...validValues, website: 'http://bot-link.com' },
      });

      expect(outcome.type).toBe('spam-fake-success');
      expect(outcome.toastType).toBe('success');
      expect(outcome.shouldReset).toBe(true);
    });

    it('Branch 2: returns validation-error when required fields are missing/invalid', async () => {
      const outcome = await resolveSubmissionOutcome({
        values: { ...validValues, email: 'invalid-email' },
      });

      expect(outcome.type).toBe('validation-error');
      expect(outcome.toastType).toBe('error');
      expect(outcome.shouldReset).toBe(false);
    });

    it('Branch 3: returns mailto-fallback when offline', async () => {
      const outcome = await resolveSubmissionOutcome({
        values: validValues,
        onLine: false,
        serviceId: 's',
        templateId: 't',
        publicKey: 'p',
      });

      expect(outcome.type).toBe('mailto-fallback');
      expect(outcome.toastType).toBe('info');
      expect(outcome.message).toContain('offline');
      expect(outcome.mailtoHref).toContain('mailto:');
      expect(outcome.shouldReset).toBe(false);
    });

    it('Branch 4: returns emailjs-success when send succeeds', async () => {
      const sendMock = vi.fn(() => Promise.resolve({ status: 200 }));
      const outcome = await resolveSubmissionOutcome({
        values: validValues,
        onLine: true,
        serviceId: 's',
        templateId: 't',
        publicKey: 'p',
        sendEmailFn: sendMock,
      });

      expect(outcome.type).toBe('emailjs-success');
      expect(outcome.toastType).toBe('success');
      expect(outcome.shouldReset).toBe(true);
      expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it('Branch 5: returns emailjs-error with mailto fallback when send fails', async () => {
      const sendMock = vi.fn(() => Promise.reject(new Error('Network error')));
      const outcome = await resolveSubmissionOutcome({
        values: validValues,
        onLine: true,
        serviceId: 's',
        templateId: 't',
        publicKey: 'p',
        sendEmailFn: sendMock,
      });

      expect(outcome.type).toBe('emailjs-error');
      expect(outcome.toastType).toBe('info');
      expect(outcome.mailtoHref).toContain('mailto:');
      expect(outcome.shouldReset).toBe(false);
      expect(outcome.error).toBeDefined();
    });
  });
});
