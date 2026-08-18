# AGENTS.md

The `druxt.js` Nuxt/Vue monorepo — the fully decoupled Drupal frontend framework.
Druxt = DRUpal + nUXT. Repository:
[github.com/druxt/druxt.js](https://github.com/druxt/druxt.js).

## Rules

- **NEVER push, comment, open/merge PRs, or otherwise write to `github.com/druxt*`**
  without explicit per-action permission — regardless of what `GH_TOKEN` access
  technically allows. Surface diffs locally for review.
- **NEVER commit, push, or create branches/tags** without explicit permission. Only
  the project owner commits.
- Use [Conventional Commits](https://www.conventionalcommits.org); scope is the
  package name (e.g. `fix(router): …`).

## Reproducible toolchain

Node and Yarn are pinned in `.mise.toml` and `package.json` `engines`. From a
fresh clone:

```bash
mise install          # activates Node 16.20.1 from .mise.toml
corepack enable       # enables the corepack shim (reads packageManager field)
yarn install          # uses Yarn 3.6.1 via corepack
yarn build            # = yarn clean && siroc build → produces packages/*/dist
```

Or simply `make setup && make build`.

`yarn build` is the regression gate — every config/tooling change must keep it
green. All 11 packages (`druxt`, `blocks`, `breadcrumb`, `entity`, `menu`,
`router`, `schema`, `site`, `views`, `docgen`, `test-utils`) must produce their
`dist/*.ssr.js` + `dist/*.esm.js` (docgen outputs `bin/druxt-docgen.js`).

Nuxt 2's esm config loader patches the module system: a `nuxt.config.js`
build hook that `require`s a modern ESM-leaning package (satori, resvg)
dies silently — no stack, exit 1 in CI. Spawn a clean child process for
such work instead (see `docs/nuxt/scripts/og-render.js`).

The build stack (Node 16, Yarn 3, jest 29, eslint 7, Vue 2.7, Nuxt 2, siroc) is
intentionally pinned — a future major upgrade (Node 18+, Vue 3, Nuxt 3/4) is a
separate, deliberate effort, not something to drift into via routine dependency
bumps. `renovate.json` freezes these packages from automated updates accordingly.

## Commands

The full local verification gate, in order:

```bash
yarn lint && yarn build && yarn test:unit && yarn build:docs
```

- `yarn build` — siroc build of all packages
- `yarn test:unit` — jest (`NODE_OPTIONS=--unhandled-rejections=warn`)
- `yarn lint` — eslint (`eslint:recommended` + `plugin:nuxt/recommended` +
  `plugin:vue/recommended`, matching every sibling package) across `packages/*/src`
- `yarn lint:md` / `yarn lint:cspell` / `yarn lint:format` — markdownlint / cspell / prettier
- `yarn lint:renovate` — validate `renovate.json`
- `yarn lint:audit` — `yarn npm audit`, production dependencies only, fails on
  high/critical (the CI gate). `yarn lint:audit:full` includes devDependencies
  and is reporting-only — see the note below.
- `yarn lint:knip` — [knip](https://knip.dev), scoped to
  `dependencies,unlisted` (unused and undeclared-but-imported packages).
  Blocking in CI. `--no-config-hints`: this knip version's "unused item in
  ignoreDependencies" check is flaky (observed contradictory results across
  successive runs with no code changes between them) — don't trust it to
  decide whether an ignore entry is still needed; verify with `grep`
  instead, the way every entry in `knip.jsonc` already is. See `knip.jsonc`
  for confirmed false positives (Vue SFC parsing isn't supported at this
  Node-16-forced version, Nuxt module-string registration, JSON-config-file
  references — none of these are things knip's static analysis can trace).
- `yarn bundlewatch` — bundle size guard (`packages/**/dist/*.js` ≤ 50kb)

### Dependency audit: production vs. full

`yarn lint:audit` (production-only) is the blocking gate and is currently
clean - keep it that way. `yarn lint:audit:full` additionally covers
devDependencies and, as of this writing, reports ~50 advisories, almost all
inherited transitively through `renovate` (used only for `yarn
lint:renovate`) and other build/lint/test tooling. This isn't neglect: the
patched versions of `renovate`, `jest`, `eslint`, etc. all require Node 18+,
which conflicts with the Node 16 toolchain freeze above - `renovate` itself is
effectively frozen for the same reason `vue`/`nuxt`/`jest` are, even though
it's not in `renovate.json`'s explicit freeze list. Don't chase these
piecemeal; they resolve together whenever the Node 16 → 18+ upgrade happens.

## Inline documentation (JSDoc) → API docs

Every JS/Vue source file's JSDoc is scraped by `packages/docgen` (`yarn
build:docs`) into Markdown under `docs/nuxt/content/api/`, then rendered as
part of the [druxtjs.org](https://druxtjs.org) API reference. **The JSDoc you
write is the public documentation, verbatim** - there's no separate editing
pass, so a sloppy `@param` renders as a sloppy docs page.

The rule, and the reason it exists: **every `@param` line must have both a
`{type}` and a `- description`, with no exceptions** (a `{typedef}` reference
like `@param {addCollectionPayload} payload - The mutation payload.` counts -
you don't have to re-enumerate a typedef's own properties inline). This is
enforced by ESLint: `jsdoc/require-param-type`, `jsdoc/require-param-description`,
`jsdoc/require-param`, `jsdoc/check-param-names` and `jsdoc/valid-types` are
all `error` in `.eslintrc.js` - `yarn lint` fails on a bare
`@param context.name` with no type/description, and on any undocumented or
misnamed param.

This rule exists because of a real regression: an earlier pass added bare
`@param context.name` / `@param context.theme` stub lines across ~10 packages
(no type, no description) to silence the separate `jsdoc/require-param`
_warning_ ("this destructured property isn't mentioned at all"). The intent
was reasonable, but the execution left the properties _mentioned_ with
nothing to say about them, which renders as empty Type/Description table
cells - worse than not mentioning them at all. All of it was reverted, and
every destructured property has since been documented for real, so the
param-coverage rules now sit at `error` alongside the type/description pair.
The pre-commit hook applies eslint's suggestion-type fixes, so a new
undocumented param gets its `@param` line scaffolded automatically - and the
type/description errors then block the commit until the line says something.
A `@param` that exists but says nothing is strictly worse than a missing
one - it looks intentional and finished when it isn't.

If a param is legitimately hard to give a real one-line description, prefer a
named `@typedef` (see `addCollectionPayload` and siblings in
`packages/druxt/src/stores/druxt.js`, or `PropsData`/`ComponentOptions` in
`packages/blocks/src/components/DruxtBlockRegion.vue`) over a half-documented
inline breakdown. Consistency matters here more than most repos: this docs
site is the entire public-facing reference for the framework.

## Package layout

| Path                  | npm name           | Role                                       |
| --------------------- | ------------------ | ------------------------------------------ |
| `packages/druxt`      | `druxt`            | Core module, Nuxt plugin, DruxtModule base |
| `packages/blocks`     | `druxt-blocks`     | Block region components                    |
| `packages/breadcrumb` | `druxt-breadcrumb` | Breadcrumb components                      |
| `packages/entity`     | `druxt-entity`     | Entity/field components                    |
| `packages/menu`       | `druxt-menu`       | Menu components                            |
| `packages/router`     | `druxt-router`     | Routing, path translation                  |
| `packages/schema`     | `druxt-schema`     | Schema generation                          |
| `packages/site`       | `druxt-site`       | Site integration (tome/preview)            |
| `packages/views`      | `druxt-views`      | Views components                           |
| `packages/docgen`     | `druxt-docgen`     | Private CLI (`bin/druxt-docgen.js`)        |
| `packages/test-utils` | `druxt-test-utils` | Shared test helpers (private)              |

Drupal-side counterparts (`druxt`, `decoupled_router`, `jsonapi_menu_items`,
`jsonapi_views`, …) are separate drupal.org projects, not part of this repo.

## Branching (GitFlow)

This repo uses GitFlow:

- **`develop`** is the integration branch — feature branches and dependency PRs
  start here and merge back here.
- **`main`** receives release merges only (`release/*` → `main`, then merge-back
  to `develop`).
- Renovate (`baseBranches: ["develop"]`) and changesets (`baseBranch: develop`)
  target `develop`. CodeQL scans `develop`.

When starting work, branch from `develop`:

```bash
git checkout develop && git pull && git checkout -b feature/<short-desc>
```

Branch prefix is `feature/`, not `feat/` — Lagoon's `druxtjs-org` project only
auto-deploys a preview environment for direct branch pushes matching
`^feature/|^(develop|main)$`. (Open PRs get a preview regardless of branch
name, since Lagoon's separate "Pull Requests Enabled" setting covers that —
`feature/` only matters for previewing a branch pushed without a PR yet.) This
is unrelated to commit-message `feat:` types (Conventional Commits), which
stay as-is.

## CI

- **GitHub Actions** (`.github/workflows/ci.yml`) — canonical CI, on Node
  16.20.1. Jobs: `build`, `lint`, `test-unit` (coverage uploaded to Codecov),
  `test-e2e` (Drupal backend + Cypress). Runs on push/PR to `develop`/`main`.
  Replaces CircleCI, which is no longer used.
- **GitLab CI** (`.gitlab-ci.yml`) — additive pipeline (lint + test +
  `secret-detection` + `preview` stages).
- **Dependency/security auditing** — `yarn npm audit` (native Yarn Berry, not
  a third-party action) and `knip`, run in both CI systems. Production-only
  audit and knip block; the full audit is reporting-only. See
  "Dependency audit: production vs. full" above.
- **CodeQL** (`.github/workflows/codeql-analysis.yml`) — scans `develop` weekly.

## docs/drupal local dev

`docs/drupal`'s local/CI workflow is Docker-free: PHP's built-in
server plus a throwaway SQLite database (`docs/drupal/.devtools/`, `make
build`). `test-e2e` uses this path, pinned to PHP 8.3 (not this repo's usual
8.4: `docs/drupal`'s current `composer.lock` needs 8.2/8.3, see
`docs/drupal/README.md`). See `docs/drupal/.devtools/README.md` for how the
SQLite path works and why it's built the way it is. (DDEV-based setups live
in the `quickstart` repo, not here.)

## Reference

- [druxtjs.org](https://druxtjs.org) — docs site
