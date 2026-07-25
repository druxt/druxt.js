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
yarn install          # uses Yarn 3.6.1 via corepack (packageManager field)
yarn build            # = yarn clean && siroc build → produces packages/*/dist
```

`yarn build` is the regression gate — every config/tooling change must keep it
green. All 11 packages (`druxt`, `blocks`, `breadcrumb`, `entity`, `menu`,
`router`, `schema`, `site`, `views`, `docgen`, `test-utils`) must produce their
`dist/*.ssr.js` + `dist/*.esm.js` (docgen outputs `bin/druxt-docgen.js`).

The build stack (Node 16, Yarn 3, jest 27, eslint 7, Vue 2.7, Nuxt 2, siroc) is
intentionally pinned — a future major upgrade (Node 18+, Vue 3, Nuxt 3/4) is a
separate, deliberate effort, not something to drift into via routine dependency
bumps. `renovate.json` freezes these packages from automated updates accordingly.

## Commands

- `yarn build` — siroc build of all packages
- `yarn test:unit` — jest (`NODE_OPTIONS=--unhandled-rejections=warn`)
- `yarn lint` — eslint (airbnb-base) across `packages/*/src`
- `yarn lint:md` / `yarn lint:cspell` / `yarn lint:format` — markdownlint / cspell / prettier
- `yarn lint:renovate` — validate `renovate.json`
- `yarn bundlewatch` — bundle size guard (`packages/**/dist/*.js` ≤ 50kb)

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
git checkout develop && git pull && git checkout -b feat/<short-desc>
```

## CI

- **CircleCI** (`.circleci/config.yml`) — canonical CI on `cimg/node:16.20.2`.
  Jobs: `build`, `lint`, `test_unit`, `test_e2e` (ddev + Drupal + Cypress). The
  `deploy` job is commented out (separate work).
- **GitLab CI** (`.gitlab-ci.yml`) — additive pipeline (lint + test +
  `secret-detection` stage); does not replace CircleCI.
- **CodeQL** (`.github/workflows/codeql-analysis.yml`) — scans `develop` weekly.

## Reference

- [druxtjs.org](https://druxtjs.org) — docs site
