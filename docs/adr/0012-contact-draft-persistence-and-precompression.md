# 0012 — Contact Draft Persistence, Pre-compression, and Staging No-Index

Status: Accepted  
Date: 2026-08-16

## Context

Three operational improvements were identified during architecture review:

1. Contact form inputs could be accidentally lost if a user refreshed or temporarily navigated away before submitting.
2. Production builds relied exclusively on on-the-fly server compression, missing static Brotli/Gzip pre-compression benefits for static CDNs.
3. The upstream development repository needed search engine crawl prevention (`noindex, nofollow`) pending official release forks.

## Decision

1. **Contact draft persistence (`src/utils/contactDraft.js`):** Auto-saves non-empty form inputs (excluding the hidden honeypot) to `sessionStorage` on change. The hook `useContactForm` hydrates state on mount and clears storage on successful submission or spam discard.
2. **Build-time pre-compression (`vite.config.js`):** Added a zero-dependency Vite build plugin leveraging `node:zlib` to generate `.br` (Brotli quality 11) and `.gz` (Gzip level 9) assets during production builds.
3. **Staging crawler exclusion (`index.html`, `public/robots.txt`):** Configured `<meta name="robots" content="noindex, nofollow" />` and root `robots.txt` to prevent indexing until downstream release.

## Consequences

- **Positive:** Improved user resilience against accidental reloads, zero network overhead added, and instant static compression delivery on CDN edges.
- **Negative / trade-offs:** Build time adds ~100-200ms of synchronous compression for text assets.
