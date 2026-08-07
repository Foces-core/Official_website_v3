# 0003 — Events Come From Static Data, Not the Sanity CMS

Status: Accepted
Date: 2026-08-07

## Context

The previous site generation ("web v23") managed events in a Sanity CMS
studio and fetched them at runtime. The current site was rebuilt around
static, build-time-bundled content: faster first paint, no CMS round-trip,
no content API dependency, and image optimization at build time.

## Decision

`src/data/events.js` is the single source of truth for events. The home
"Events" section (`src/Pages/LandingPages/Events.jsx`) and the `/events`
route (`src/Pages/EventPage/Eventpage.jsx`) both render from it, so they can
never drift apart. Event images are bundled, optimized `.webp` assets with
responsive `srcset` variants. The only surviving CMS link is
`src/utils/sanityImage.js`, which still optimizes any URL that happens to be
a `cdn.sanity.io` asset (local assets pass through untouched).

## Consequences

- Positive: events render instantly, images are compressed at build time,
  and there is no runtime fetch or failure mode.
- Negative: adding an event means editing `src/data/events.js` and adding
  images to the build — a code change, not a CMS edit. That is intentional
  for a club site whose event set changes rarely.
- Follow-up: if events ever need frequent, non-developer editing, revisit
  the CMS approach (see `foces-webv23/`); until then, keep the static source
  of truth.
