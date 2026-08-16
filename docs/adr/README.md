# Architecture Decision Records (ADR)

Status conventions: **Accepted** (settled), **Proposed** (under review),
**Deprecated** (no longer the way).

## Index

| #                                                            | Title                                                                            | Status   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------- |
| [0001](0001-perf-is-a-feature.md)                            | Performance is a feature: device-profile degradation                             | Accepted |
| [0002](0002-pwa-shell-only-precache.md)                      | PWA precache is app-shell only                                                   | Accepted |
| [0003](0003-static-events-data.md)                           | Events come from static data, not the Sanity CMS                                 | Accepted |
| [0004](0004-foces-webv23-studio.md)                          | Keep the foces-webv23 Sanity studio in-repo, untooled                            | Accepted |
| [0005](0005-inline-boot-splash.md)                           | Static inline boot splash for near-instant first paint                           | Accepted |
| [0006](0006-knip-dead-code-guard.md)                         | Knip guards against dead code and unused dependencies                            | Accepted |
| [0007](0007-touch-gesture-ownership.md)                      | Interactive widgets own their touch gesture                                      | Accepted |
| [0008](0008-chunk-load-error-recovery.md)                    | Lazy chunks recover automatically, never the error screen                        | Accepted |
| [0009](0009-pure-logic-test-seams.md)                        | Behavior lives in pure tested modules; components are wiring                     | Accepted |
| [0010](0010-hooks-orchestration-spec-guard.md)               | Orchestration lives in hooks; pure decisions stay in modules, spec-guarded in CI | Accepted |
| [0011](0011-contact-form-honeypot-spam-defense.md)           | Contact form honeypot spam defense                                               | Accepted |
| [0012](0012-contact-draft-persistence-and-precompression.md) | Contact draft persistence, pre-compression, and staging no-index                 | Accepted |

## Adding a new ADR

1. Copy `_template.md` to `NNNN-short-title.md` (next number in the index).
2. Fill in Context / Decision / Consequences (keep it short — a few lines
   each is plenty).
3. Add a row to the index table above.
