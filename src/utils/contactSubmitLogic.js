import { validateContactForm, isSpamSubmission } from './validateContactForm.js';

export const CONTACT_EMAIL = 'Sebinmathew543@gmail.com';

/**
 * Pure decision: which channel should a submission use?
 *
 * @param {{ onLine: boolean, serviceId?: string, templateId?: string, publicKey?: string }} env
 * @returns {'emailjs' | 'mailto'}
 */
export function resolveSendChannel({ onLine, serviceId, templateId, publicKey }) {
  return !onLine || !serviceId || !templateId || !publicKey ? 'mailto' : 'emailjs';
}

/**
 * Pure builder for the mailto fallback href.
 *
 * @param {{ name: string, email: string, subject: string, message: string }} values
 * @returns {string}
 */
export function buildMailtoHref({ name, email, subject, message }) {
  const subjectEncoded = encodeURIComponent(subject);
  const bodyEncoded = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  return `mailto:${CONTACT_EMAIL}?subject=${subjectEncoded}&body=${bodyEncoded}`;
}

/**
 * Pure decision: evaluates form values, network status, and configuration
 * to resolve the submission outcome descriptor without side-effects.
 *
 * @param {{
 *   values: { name: string, email: string, subject: string, message: string, website?: string },
 *   onLine?: boolean,
 *   serviceId?: string,
 *   templateId?: string,
 *   publicKey?: string,
 *   sendEmailFn?: (serviceId: string, templateId: string, params: any, key: string) => Promise<any>
 * }} context
 * @returns {Promise<{
 *   type: 'spam-fake-success' | 'validation-error' | 'mailto-fallback' | 'emailjs-success' | 'emailjs-error',
 *   toastType: 'success' | 'error' | 'info',
 *   message: string,
 *   shouldReset: boolean,
 *   mailtoHref?: string,
 *   error?: any
 * }>}
 */
export async function resolveSubmissionOutcome({
  values,
  onLine = true,
  serviceId,
  templateId,
  publicKey,
  sendEmailFn,
}) {
  // 1. Honeypot spam submission -> fake success
  if (isSpamSubmission(values)) {
    return {
      type: 'spam-fake-success',
      toastType: 'success',
      message: 'Message sent successfully!',
      shouldReset: true,
    };
  }

  // 2. Client-side field validation error
  const validationError = validateContactForm(values);
  if (validationError) {
    return {
      type: 'validation-error',
      toastType: 'error',
      message: validationError,
      shouldReset: false,
    };
  }

  // 3. Send channel resolution (offline or missing keys -> mailto)
  const channel = resolveSendChannel({ onLine, serviceId, templateId, publicKey });
  if (channel === 'mailto') {
    return {
      type: 'mailto-fallback',
      toastType: 'info',
      message: !onLine
        ? 'You are offline. Opening email app...'
        : 'Opening your email app to send message...',
      mailtoHref: buildMailtoHref(values),
      shouldReset: false,
    };
  }

  // 4. EmailJS execution
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
    if (typeof sendEmailFn === 'function') {
      await sendEmailFn(serviceId, templateId, templateParams, publicKey);
    }
    return {
      type: 'emailjs-success',
      toastType: 'success',
      message: 'Message sent successfully!',
      shouldReset: true,
    };
  } catch (err) {
    return {
      type: 'emailjs-error',
      toastType: 'info',
      message: 'Opening your email app to send message...',
      mailtoHref: buildMailtoHref(values),
      shouldReset: false,
      error: err,
    };
  }
}
