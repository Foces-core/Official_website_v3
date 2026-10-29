# 0027 — Measured Per-Photo Portrait Framing

Status: Accepted
Date: 2026-10-29

## Context

Team portraits have different headroom above the face. A shared percentage `object-position` frames each photo differently, and on wide desktop cards it has almost no effect. Faces did not line up across the carousel.

## Decision

Each roster entry can carry a measured pixel offset as `objectPosition` (`center calc(50% ± Npx)`) and a backdrop colour as `portraitBg`, in `src/data/team.js` and `src/Components/Execom/desktopTeamData.js`. `TeamCarousel` applies them as inline styles. This is a scoped exception to the "no inline `style={{}}`" rule. The values are per-photo measurements stored as data, and arbitrary Tailwind classes would need one literal class string per member to survive class scanning.

## Consequences

- Positive: faces line up across photos without changing card size or cover behaviour, and the backdrop strip opened by a downward shift matches the studio grey.
- Negative / trade-offs: replacing a photo also means measuring its offset again. These two fields are the only inline visual styles on the card.
- Follow-ups: Playwright asserts the computed `object-position` and backdrop for each adjusted portrait.
