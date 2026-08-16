# 0011 — Contact Form Honeypot Spam Defense

Status: Accepted  
Date: 2026-08-16

## Context

The contact form previously lacked automated bot spam filtering. Third-party CAPTCHA widgets (reCAPTCHA, Turnstile) add significant external bundle overhead, network round-trips, and layout-thrash that directly violate our performance budget (`ADR-0001`). We needed a lightweight, zero-dependency spam mitigation strategy for the EmailJS submission flow.

## Decision

Implement client-side honeypot spam protection:

1. `src/Components/ContactUs/ContactUs.jsx` renders a hidden `website` input (`aria-hidden="true"`, `tabIndex={-1}`, `display: none`).
2. `src/utils/validateContactForm.js` exports a pure `isSpamSubmission` predicate.
3. `src/hooks/useContactForm.js` drops spam submissions silently (emits a synthetic success toast and clears state) without invoking EmailJS or the `mailto:` fallback.

## Consequences

- **Positive:** Zero external dependencies, zero latency impact, and no degradation for real users on slow/low-end devices. Prevents EmailJS quota exhaustion from automated form scrapers.
- **Negative / trade-offs:** Advanced headless scrapers executing full DOM heuristics may bypass simple honeypots; a serverless backend or Turnstile can be introduced later if abuse volume necessitates it.
