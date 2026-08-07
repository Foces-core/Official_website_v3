## What does this PR do?

<!-- Short, concrete description. Link the issue it closes, e.g. "Closes #12". -->

## Screenshots / recordings

<!-- Required for UI changes. Drag an image or record a short clip. -->

## How to test

1. `pnpm install`
2. `pnpm dev` → open http://localhost:5173
3. <!-- Steps to reproduce/verify -->

## Checklist

- [ ] `pnpm lint` passes with **no errors**
- [ ] `pnpm build` completes successfully
- [ ] Tested on desktop **and** mobile viewports
- [ ] If the change touches performance paths: `useDeviceProfile` (slow-network / low-power) behavior preserved
- [ ] If interactive: keyboard navigable with visible `:focus-visible` styling
- [ ] No new inline `style={{}}` objects (prefer CSS files / Tailwind utilities)
