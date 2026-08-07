# foces-webv23 — Sanity CMS Studio

> **Why is this here?** This directory is the Sanity Content Studio for the
> **previous generation** of the FOCES website ("web v23"). It is **not** part
> of the current build: the live site (`src/`) does not import or build any of
> this code. It lives in this repo so the older CMS remains recoverable,
> editable, and documented — it is deliberately **excluded** from the build,
> lint, and format tooling.

## Relationship to the current site

- **This studio** (`foces-webv23/`): Sanity Studio v3 + React 18, own
  `package.json` / `yarn.lock`. Manages `event`, `notification`, and
  `featuring` documents in the Sanity project `n7hx0w67` (dataset
  `production`). Run with `sanity dev` from inside this directory.
- **The current site** (`src/`): events are now authored in **local static
  data** (`src/data/events.js`) with bundled, optimized images — they no
  longer come from Sanity. The only surviving link is the passthrough helper
  `src/utils/sanityImage.js`, which still optimizes any URL that happens to be
  a `cdn.sanity.io` asset (local assets pass through untouched).

## What lives here

| Path | Purpose |
| --- | --- |
| `sanity.config.js` | Studio config: project id, dataset, plugins |
| `sanityClient.js` | Read-only Sanity client (CDN) for ad-hoc queries |
| `schemas/` | Document schemas: `event`, `notification`, `featuring` |
| `static/` | Studio assets |

## Working with it

Requires Node 18+ (older React 18 / Sanity 3 toolchain). Install and run from
**inside this directory** — it is a separate package on purpose:

```sh
cd foces-webv23
yarn install
yarn dev        # http://localhost:3333
```

Useful commands (from the studio's own `package.json`):

```sh
yarn build          # sanity build
yarn deploy         # sanity deploy  (deploys the studio to *.sanity.studio)
yarn deploy-graphql # sanity graphql deploy
```

## Gotchas for agents

- **Never lint/format/build this directory from the repo root.** The root
  tooling is pnpm + Vite + ESLint 10 flat config; this dir is yarn + Sanity
  + ESLint 8. They use different package managers and different configs on
  purpose. The root `.eslintignore`-derived `ignores` in
  `eslint.config.js` and `.prettierignore` already exclude it.
- **Do not "upgrade to match the root."** The root uses React 19 + Vite 8;
  this studio pins Sanity 3 / React 18 because Sanity Studio currently
  depends on that line. A version bump here is a separate, deliberate task.
- **Secrets:** the Sanity project id is not a secret, but the studio's auth
  token (if any) must stay out of git.
- If the CMS is ever fully retired, this directory can be deleted along with
  `src/utils/sanityImage.js` — until then, treat it as an archived-but-live
  tool, not dead weight.
