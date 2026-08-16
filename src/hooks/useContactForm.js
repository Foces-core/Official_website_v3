import { useState } from 'react';
import { toast } from 'react-toastify';
import emailjs from '@emailjs/browser';
import {
  CONTACT_EMAIL,
  resolveSendChannel,
  buildMailtoHref,
  resolveSubmissionOutcome,
} from '../utils/contactSubmitLogic.js';
import { loadContactDraft, saveContactDraft, clearContactDraft } from '../utils/contactDraft.js';

export { CONTACT_EMAIL, resolveSendChannel, buildMailtoHref };

const EMPTY_VALUES = { name: '', email: '', subject: '', message: '', website: '' };
const TOAST_STYLE = { className: 'toast-custom' };

function openMailtoHref(href) {
  const link = document.createElement('a');
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * useContactForm — the contact form as one module.
 *
 * Owns form state, field drafts, submission execution, and toast triggers.
 * Pure submission outcome resolution lives in contactSubmitLogic.js (ADR-0009).
 */
export default function useContactForm() {
  const [values, setValues] = useState(() => loadContactDraft());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (e) => {
    const { name, value } = e.target;
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      saveContactDraft(next);
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const outcome = await resolveSubmissionOutcome({
      values,
      onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
      serviceId,
      templateId,
      publicKey,
      sendEmailFn: emailjs.send.bind(emailjs),
    });

    if (outcome.error) {
      console.error('EmailJS send error:', outcome.error);
    }

    if (outcome.shouldReset) {
      clearContactDraft();
      setValues(EMPTY_VALUES);
    }

    if (outcome.mailtoHref) {
      openMailtoHref(outcome.mailtoHref);
    }

    toast.dismiss();
    if (outcome.toastType === 'success') {
      toast.success(outcome.message, { autoClose: 2000, ...TOAST_STYLE });
    } else if (outcome.toastType === 'error') {
      toast.error(outcome.message, { autoClose: 2000, ...TOAST_STYLE });
    } else {
      toast.info(outcome.message, { autoClose: 3000, ...TOAST_STYLE });
    }

    setIsSubmitting(false);
  };

  return { values, setField, submit, isSubmitting };
}
