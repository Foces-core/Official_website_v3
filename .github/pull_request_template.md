## What does this PR do?

<!-- Short, concrete description. Link the issue it closes, e.g. "Closes #12". -->

## Screenshots / recordings

<!-- Required for UI changes. Drag an image or record a short clip. -->

## How to test

1. `pnpm install`
2. `pnpm dev` → open http://localhost:5173
3. <!-- Steps to reproduce/verify -->
4. `pnpm verify` — runs the fast gate (lint + format check + unit tests +
   structural checks + build) in one command; CI runs the same checks on
   this PR (watch with `gh pr checks <number> --watch`)

## Checklist

- [ ] `pnpm verify` passes (lint + format + unit tests + structural checks + build)
- [ ] `pnpm knip` passes (no unused exports / files / dependencies)
- [ ] If `.github/workflows/` changed: `pnpm lint:workflows` passes (actionlint + shellcheck)
- [ ] Tested on desktop **and** mobile viewports
- [ ] If the change touches performance paths: `useDeviceProfile` (slow-network / low-power) behavior preserved
- [ ] If interactive: keyboard navigable with visible `:focus-visible` styling
- [ ] No new inline `style={{}}` objects (prefer CSS files / Tailwind utilities)
