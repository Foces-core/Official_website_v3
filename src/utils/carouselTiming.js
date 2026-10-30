// Post-interaction quiet window for carousel autoplay. After any
// user-driven move — nav button, keyboard arrow, drag release — autoplay
// stays parked for this long before resuming, and each new interaction
// re-extends the window. Mirrors the cube's manual-override windows in
// cubeTiming.js so ambient motion never fights the user's last action.
export const AUTOPLAY_RESUME_MS = 3000;
