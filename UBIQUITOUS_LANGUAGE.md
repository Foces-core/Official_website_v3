# Ubiquitous Language

Canonical domain glossary and terminology for the FOCES site codebase.

## Navigation & Viewport

| Term                       | Definition                                                                                                                           | Aliases to avoid                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Scrollspy**              | Viewport-geometry evaluation that marks which section is currently active                                                            | Nav watcher, section highlighter         |
| **Section scroll policy**  | Rule determining whether section transitions animate smoothly or scroll instantly based on user motion preferences (`reducedMotion`) | Smooth scroll flag, animation setting    |
| **Next-paint deferral**    | Two-frame requestAnimationFrame delay ensuring overlay DOM unmount and body scroll-lock release settle before focus/scroll           | Delay timer, setTimeout hack, double rAF |
| **Navigation coordinator** | Deep orchestration module unifying section scroll, overlay dismissal, body lock release, and paint deferral                          | Scroll manager, nav helper               |
| **Hero waves stage**       | Deep WebGL lifecycle adapter encapsulating Three.js / Vanta Waves loading, context-loss recovery, and cleanup                        | 3D background, canvas effect             |
| **Roving tabindex**        | APG pattern where exactly one item in a composite widget owns `tabindex="0"` while inactive siblings hold `tabindex="-1"`            | Tab manager, focus switcher              |
| **Viewport seam**          | Reactive window width classification against standard breakpoint thresholds (500, 767, 768, 1024)                                    | Screen size watcher, media query helper  |

## Accessibility & Interaction

| Term                     | Definition                                                                                                                 | Aliases to avoid                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **ARIA activation**      | Keyboard standard where Enter or Space triggers actions on interactive `role="button"` elements                            | Key handler, click simulator     |
| **Keyboard arbitration** | Priority system granting arrow-key control to exactly one active on-screen widget at a time                                | Focus lock, key dispatcher       |
| **Scroll lock**          | Reference-counted page scroll locking active while modal overlays or drawers are open                                      | Body freeze, modal backdrop lock |
| **Overlay lifecycle**    | Unified lifecycle management for modal dialogs and drawers (scroll-lock, focus entry, tab trapping, Escape, focus restore) | Modal manager, popup controller  |
| **Route prefetch**       | Intelligent intent, idle, and ML-trajectory prediction loading of route chunks, gated by network profile                   | Page preload, quick loader       |

## Content & Media

| Term                          | Definition                                                                                                  | Aliases to avoid               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Event**                     | Official fest or club activity recorded in the single source of truth (`src/data/events.js`)                | Activity, programme            |
| **Event photo**               | Responsive image descriptor holding `{ url, srcset }` candidates for an event                               | Image item, picture record     |
| **Team roster**               | Roster of Execom members with assigned roles, photos, and links                                             | Member list, committee data    |
| **Echo slide**                | Highlighted feature card in the Featuring carousel                                                          | Carousel card, showcase banner |
| **ScrollGate**                | Intersection-based lazy container that defers mounting heavy components until near the viewport             | Lazy loader, suspense trigger  |
| **Cube drag mechanics**       | 3D interactive physics and rotation engine driving the About section cube                                   | 3D container, cube rotator     |
| **Easter egg celebration**    | Rapid-spin easter egg trigger on the About cube rewarding user interaction with toasts and particle effects | Spin reward, bonus animation   |
| **Honeypot spam defense**     | Invisible form input (`website`) trapping automated bot submissions without external CAPTCHA bundles        | Bot blocker, captcha gate      |
| **Contact draft persistence** | Automatic session saving of unsubmitted contact form fields (`sessionStorage`) restoring on page reload     | Form storage, auto-save state  |

## Relationships

- A **Device profile** governs both **Autoplay gating** and the **Section scroll policy**.
- A **Scroll lock** reference count increments on each open overlay (**Navbar mobile drawer**, **Event modal**) and releases only when the count returns to zero.
- **Next-paint deferral** executes focus restoration after the **Scroll lock** has released on overlay unmount.
- **Keyboard arbitration** evaluates the topmost on-screen widget among the **Cube drag mechanics** and **Team carousel**.
- **ARIA activation** converts Enter and Space keystrokes into synthetic activation for custom interactive elements.

## Example dialogue

> **Dev:** "How should the mobile navbar restore focus when closed?"  
> **Domain expert:** "Use **Next-paint deferral**. It waits two frames so the **Scroll lock** unmounts cleanly before focusing the toggle."  
> **Dev:** "And if the user clicks a nav link while `prefers-reduced-motion` is active?"  
> **Domain expert:** "The **Section scroll policy** resolves to `auto` rather than `smooth` so the scroll happens instantaneously."  
> **Dev:** "Do custom gallery thumbnails need custom keyboard bindings?"  
> **Domain expert:** "Yes, bind them through **ARIA activation** so both Enter and Space trigger gallery expansion while preventing default spacebar page scrolling."

## Flagged ambiguities

- `"review"` vs **Role**: The Execom data previously used `review` to hold member titles; this is canonically **Role** (`Chairperson`, `Secretary`, etc.).
- `"animation"` vs **Section scroll policy**: Anchor transitions must never hardcode CSS/DOM `smooth` — they must always consult the motion policy from the **Device profile**.
