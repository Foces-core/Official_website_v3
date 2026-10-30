const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Per-field character ceilings — enforced here in JS, deliberately not as
 * input maxLength attributes: an attribute silently truncates pasted text,
 * whereas a validator error tells the user and preserves their input.
 * 254 is the RFC 5321 email ceiling; the rest are generous product limits
 * that keep oversized payloads away from the EmailJS integration.
 */
export const FIELD_LIMITS = { name: 100, email: 254, subject: 150, message: 2000 };

/**
 * Pure contact-form validation. Returns the first error message string, or
 * null when the form is valid. The message literals are the UI contract —
 * tests/contact.spec.js asserts them end-to-end, so change them in both
 * places if you ever reword them.
 *
 * Order matters: a blank form reports "fill in all fields" before the email
 * check, even if the email is also malformed.
 *
 * @param {{ name: string, email: string, subject: string, message: string }} form
 * @returns {string | null}
 */
export function validateContactForm(form) {
  const { name, email, subject, message } = form;
  // NB: not `String(value)` — String(undefined) is 'undefined', a truthy
  // string, which would let an absent field slip past the blank check.
  const [nameT, emailT, subjectT, messageT] = [name, email, subject, message].map((value) =>
    value == null ? '' : String(value).trim(),
  );
  if (!nameT || !emailT || !subjectT || !messageT) {
    return 'Please fill in all fields.';
  }
  const trimmed = { name: nameT, email: emailT, subject: subjectT, message: messageT };
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (trimmed[field].length > limit) {
      return `Please keep the ${field} field under ${limit} characters.`;
    }
  }
  if (!EMAIL_RE.test(emailT)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

/**
 * Pure spam honeypot check: automated bots populate hidden fields.
 * If the honeypot field is filled, the submission is flagged as spam.
 *
 * @param {{ website?: string, botField?: string }} form
 * @returns {boolean}
 */
export function isSpamSubmission(form) {
  if (!form) return false;
  const honeypot = form.website || form.botField;
  return Boolean(honeypot && String(honeypot).trim().length > 0);
}
