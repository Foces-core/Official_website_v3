import { useState } from 'react';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import { validateContactForm } from '../utils/validateContactForm.js';

// The club inbox. Single source of truth — the contact-info link in
// ContactUs.jsx and the mailto fallback both read it, so an email change is
// one edit instead of two.
export const CONTACT_EMAIL = 'Sebinmathew543@gmail.com';

const EMPTY_VALUES = { name: '', email: '', subject: '', message: '' };

const TOAST_STYLE = { className: 'toast-custom' };

/**
 * Pure decision: which channel should a submission use?
 *
 * Extracted so the trickiest branch of the contact flow — "EmailJS is not
 * configured or we're offline — degrade to the native mail app" — is
 * unit-testable without React, EmailJS, or a browser.
 *
 * @param {{ onLine: boolean, serviceId?: string, templateId?: string, publicKey?: string }} env
 * @returns {'emailjs' | 'mailto'}
 */
export function resolveSendChannel({ onLine, serviceId, templateId, publicKey }) {
  return !onLine || !serviceId || !templateId || !publicKey ? 'mailto' : 'emailjs';
}

/**
 * Pure builder for the mailto fallback href. Exported for unit tests.
 * @param {{ name: string, email: string, subject: string, message: string }} values
 */
export function buildMailtoHref({ name, email, subject, message }) {
  const subjectEncoded = encodeURIComponent(subject);
  const bodyEncoded = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  return `mailto:${CONTACT_EMAIL}?subject=${subjectEncoded}&body=${bodyEncoded}`;
}

function openMailto(values) {
  // Dispatch an explicit anchor click to launch the native mail app
  // (iOS / Android / Windows).
  const link = document.createElement('a');
  link.href = buildMailtoHref(values);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * useContactForm — the contact form as one module.
 *
 * Owns form state, validation, the send-channel decision, the EmailJS call,
 * and the mailto fallback. The component only renders; everything behavioral
 * lives behind this interface: { values, setField, submit, isSubmitting }.
 */
export default function useContactForm() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validateContactForm(values);
    if (validationError) {
      toast.error(validationError, { autoClose: 2000, ...TOAST_STYLE });
      return;
    }

    setIsSubmitting(true);
    toast.info('Sending...', { autoClose: 2000, ...TOAST_STYLE });

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const channel = resolveSendChannel({
      onLine: navigator.onLine,
      serviceId,
      templateId,
      publicKey,
    });

    if (channel === 'mailto') {
      toast.dismiss();
      openMailto(values);
      toast.info(
        !navigator.onLine
          ? 'You are offline. Opening email app...'
          : 'Opening your email app to send message...',
        { autoClose: 3000, ...TOAST_STYLE },
      );
      setIsSubmitting(false);
      return;
    }

    const templateParams = {
      name: values.name,
      from_name: values.name,
      email: values.email,
      from_email: values.email,
      reply_to: values.email,
      subject: values.subject,
      message: values.message,
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      setValues(EMPTY_VALUES);
      toast.dismiss();
      toast.success('Message sent successfully!', { autoClose: 2000, ...TOAST_STYLE });
    } catch (err) {
      console.error('EmailJS send error:', err);
      toast.dismiss();
      openMailto(values);
      toast.info('Opening your email app to send message...', { autoClose: 3000, ...TOAST_STYLE });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, setField, submit, isSubmitting };
}
