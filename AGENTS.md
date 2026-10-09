# AGENTS.md

The druxt.js Nuxt/Vue monorepo, the fully decoupled Drupal frontend
framework. Druxt = DRUpal + nUXT. Repository:
[github.com/druxt/druxt.js](https://github.com/druxt/druxt.js).

## Rules

Druxt welcomes AI-assisted contributions. They meet the same standards as any
other change: linted, tested, documented, reviewed, and merged through a pull
request. CI is the gate, and a person is accountable for every change.

- Work on a fork. Branch from `develop`, push to your fork, and open a pull
  request against `develop` on [druxt/druxt.js](https://github.com/druxt/druxt.js). The `start-work` and `open-pr`
  skills walk through it.
- Write to the [druxt](https://github.com/druxt) GitHub organization (push,
  open pull requests or issues, comment) only when the person you work for asks for that action. Maintainers review,
  label, merge and release.
- Leave merging to a maintainer: an agent never merges a pull request, even
  when asked.
- Pass every gate as it stands. Skipped git hooks, skipped or deleted tests,
  lowered thresholds and `eslint-disable` comments are not allowed: if a check
  is wrong, fix the check in its own commit and say why in the pull request.
- Before calling work done, run the verification gate (the `verify-change`
  skill) and report its real output.
- Commits are made by the person contributing them, under their own git
  identity (`git config user.name` and `git config user.email`). An agent never commits under its own
  identity, and commit messages carry no AI attribution (no
  `Co-Authored-By: Claude`, session links or "Generated with" lines). The
  `commit-msg` and `pre-push` hooks and CI refuse both.
- Use [Conventional Commits](https://www.conventionalcommits.org). The scope
  is the issue number when there is one (`fix(#123): …`, `feat(#123): …`),
  and the package name otherwise (`fix(router): …`). The changelog links the
  issue from the scope.

## Reproducible toolchain

Node and Yarn are pinned in `.mise.toml` and `package.json` `engines`. From a
fresh clone:

```bash
mise install          # activates Node 16.20.1 from .mise.toml
corepack enable       # enables the corepack shim (reads packageManager field)
yarn install          # uses Yarn 3.8.7 via corepack
yarn build            # = yarn clean && siroc build → produces packages/*/dist
```

Or simply `make setup && make build`.

`yarn build` is the regression gate. Every config/tooling change must keep it
green. All 11 packages (`druxt`, `blocks`, `breadcrumb`, `entity`, `menu`,
`router`, `schema`, `site`, `views`, `docgen`, `test-utils`) must produce their
SSR and ESM bundles in `dist/` (docgen builds its `druxt-docgen` CLI into
`bin/` instead).

Nuxt 2's esm config loader patches the module system: a build hook in a Nuxt
config file that `require`s a modern ESM-leaning package can die silently
(no stack, exit 1 in CI). Spawn a clean child process for such work.

The build stack (Node 16, Yarn 3, jest 29, eslint 7, Vue 2.7, Nuxt 2, siroc) is
intentionally pinned. A future major upgrade (Node 18+, Vue 3, Nuxt 3/4) is a
separate, deliberate effort, not something to drift into via routine dependency
bumps. `renovate.json` freezes these packages from automated updates.

## Commands

The full local verification gate, in order:

```bash
yarn lint && yarn build && yarn test:unit
```

- `yarn build`: siroc build of all packages
- `yarn test:unit`: jest (`NODE_OPTIONS=--unhandled-rejections=warn`)
- `yarn lint`: eslint (`eslint:recommended` + `plugin:nuxt/recommended` +
  `plugin:vue/recommended`, matching every sibling package) across `packages/*/src`
- `yarn lint:md` / `yarn lint:cspell` / `yarn lint:format`: markdownlint / cspell / prettier
- `yarn lint:renovate`: validate `renovate.json`
- `yarn lint:audit`: `yarn npm audit`, production dependencies only, fails on
  high/critical (the CI gate). `yarn lint:audit:full` includes devDependencies
  and is reporting-only. See the note below.
- `yarn lint:knip`: [knip](https://knip.dev), scoped to
  `dependencies,unlisted` (unused and undeclared-but-imported packages).
  Blocking in CI. `--no-config-hints`: this knip version's "unused item in
  ignoreDependencies" check is flaky (observed contradictory results across
  successive runs with no code changes between them), so don't trust it to
  decide whether an ignore entry is still needed; verify with `grep`
  instead, the way every entry in `knip.jsonc` already is. See `knip.jsonc`
  for confirmed false positives (Vue SFC parsing isn't supported at this
  Node-16-forced version, Nuxt module-string registration, JSON-config-file
  references. None of these are things knip's static analysis can trace).
- `yarn bundlewatch`: bundle size guard (each built file in a package's `dist/` ≤ 50kb)
- `yarn perf:audit` / `yarn perf:audit:test`: the example performance audit and
  its `node:test` units. Both run under Node 22, not the repository's Node 16
  (`mise exec node@22 -- yarn perf:audit`). Not part of the gate above. The
  audit needs the examples served first. See `scripts/perf-audit/README.md`.

Before running an unfamiliar script, read it in `package.json`. Yarn 3 passes
any extra arguments to the script, so `yarn version --help` runs the real
`version` script. Releases are cut by GitHub CI, so leave the `version`,
`changeset` and `release:*` scripts to it. A hosted session may start from a
shallow clone: run `git fetch --unshallow` before drawing conclusions from the
history, such as a merge base or the commit that added a file.

### Dependency audit: production vs. full

`yarn lint:audit` (production-only) is the blocking gate and is currently
clean - keep it that way. `yarn lint:audit:full` also covers
devDependencies, which report advisories inherited through build, lint and
test tooling. This isn't neglect: the patched versions of `jest`, `eslint`,
etc. require Node 18+, which conflicts with the Node 16 toolchain freeze
above. Don't chase these piecemeal. They resolve together whenever the Node
16 → 18+ upgrade happens. `renovate` is not a devDependency: `yarn
lint:renovate` runs a pinned version through `npx`, on Node 24 in its own CI
job, because Renovate needs a current Node.

The bot itself needs one too, so `renovate.json` sets its `node` constraint to 22.
Left to itself Renovate reads `.nvmrc` and installs Node 16, then runs its own
corepack under it; that corepack calls `canParse` on `URL`, which Node 16 does not
have, and so it dies before Yarn is ever invoked. The pull request still gets
raised, with `package.json` changed and `yarn.lock` untouched, and every
`--immutable` install in CI then fails with YN0028. The constraint governs
Renovate's own sandbox only: the repository, CI and the build-stack freeze stay
on Node 16.

## Inline documentation (JSDoc) → API docs

Every JS/Vue source file's JSDoc is scraped by `packages/docgen` into
Markdown that the [druxtjs.org](https://druxtjs.org) API reference renders
(the site itself now lives in [druxt/druxtjs.org](https://github.com/druxt/druxtjs.org);
this repo provides the generator). **The JSDoc you
write is the public documentation, verbatim** - there's no separate editing
pass, so a sloppy `@param` renders as a sloppy docs page.

The rule, and the reason it exists: **every `@param` line needs both a
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
cells - worse than not mentioning them at all. The stub lines were reverted, and
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
inline breakdown. Consistency matters here more than most repos: the docs
site is the entire public-facing reference for the framework.

## Skills

The project workflow is written as skills in `.agents/skills/`, one directory
per skill, in the [Agent Skills](https://agentskills.io/specification) format.
**Before starting a task in this table, open the skill linked below and follow
it.** The path is the same in every tool:

| Skill                                                      | Use it to                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [`start-work`](.agents/skills/start-work/SKILL.md)         | Go from an issue to a `feature/` branch, a spec and a failing test    |
| [`add-changeset`](.agents/skills/add-changeset/SKILL.md)   | Version a published package change and write its changelog entry      |
| [`verify-change`](.agents/skills/verify-change/SKILL.md)   | Run the gate and the checks for what changed, and report the results  |
| [`open-pr`](.agents/skills/open-pr/SKILL.md)               | Open a pull request from a fork against `develop`                     |
| [`address-review`](.agents/skills/address-review/SKILL.md) | Fix failing CI and answer every review comment                        |
| [`triage-issue`](.agents/skills/triage-issue/SKILL.md)     | Classify, deduplicate and reproduce an issue, and write up the result |
| [`write-skill`](.agents/skills/write-skill/SKILL.md)       | Add or change a skill, with its evals                                 |

Claude Code, OpenCode, Codex, Cursor, Copilot and Gemini CLI all find them
there (`CONTRIBUTING.md` explains how). Edit the skills in `.agents/skills/`.

Skills are tested like code, with community tools:

- `yarn lint:skills` runs [agnix](https://github.com/agent-sh/agnix) over the
  skills, this file and the agent config (spec fields, names, links). It
  runs with `--strict`, so a warning fails it too, and `.agnix.toml` lists
  any rule turned off, with the reason. agnix doesn't check that a
  description says when to load the skill, so
  `scripts/skills/check-descriptions.mjs` fails any description without a
  "Use when" sentence. It blocks in CI and runs on staged
  skills before each commit.
- `yarn skills:eval` runs each skill's evals (such as
  `.agents/skills/start-work/evals/tests.yaml`) through
  [promptfoo](https://www.promptfoo.dev/docs/guides/test-agent-skills/):
  prompts that should load the skill, prompts that should not, and behaviour
  cases. It spends model tokens, so it runs locally only, never in CI. It
  needs Node 22 (`mise exec node@22 -- yarn skills:eval`) and your Claude
  Code login or `ANTHROPIC_API_KEY`. The config is
  `.agents/evals/promptfooconfig.yaml`.

Public Vue and Nuxt skills target Vue 3 and Nuxt 3/4 (Composition API,
`<script setup>`, Nitro). Druxt is Vue 2.7 and Nuxt 2 with the Options API, so
follow the patterns in the existing packages instead.

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
| `packages/docgen`     | `druxt-docgen`     | Private CLI (`bin/druxt-docgen`)           |
| `packages/test-utils` | `druxt-test-utils` | Shared test helpers (private)              |

Drupal-side counterparts (`druxt`, `decoupled_router`, `jsonapi_menu_items`,
`jsonapi_views`, …) are separate drupal.org projects, not part of this repo.

## Branching (GitFlow)

This repo uses GitFlow:

- **`develop`** is the integration branch. Feature branches and dependency PRs
  start here and merge back here.
- **`main`** receives release merges only (`release/*` → `main`, then merge-back
  to `develop`).
- Renovate (`baseBranches: ["develop"]`) and changesets (`baseBranch: develop`)
  target `develop`. CodeQL scans `develop`.

When starting work, branch from `develop`:

```bash
git checkout develop && git pull && git checkout -b feature/<issue>-<short-desc>
```

Branch prefix is `feature/`, not `feat/`. (The docs site's Lagoon project
keyed its branch previews on that prefix; the site now deploys from
[druxt/druxtjs.org](https://github.com/druxt/druxtjs.org), and the prefix
stays as this repo's convention.) This is unrelated to commit-message
`feat:` types (Conventional Commits), which stay as-is.

## CI

- **GitHub Actions** (`.github/workflows/ci.yml`): canonical CI, on Node
  16.20.1. Jobs: `build`, `lint`, `test-unit` (coverage uploaded to Codecov),
  `test-e2e` (Drupal backend + Cypress). Runs on push to `develop`/`main`, and on every pull request whatever its base branch.
  Replaces CircleCI, which is no longer used.
- **GitLab CI** (`.gitlab-ci.yml`): additive pipeline (lint + test +
  `secret-detection` + `preview` stages).
- **Dependency/security auditing**: `yarn npm audit` (native Yarn Berry, not
  a third-party action) and `knip`, run in both CI systems. Production-only
  audit and knip block. The full audit is reporting-only. See
  "Dependency audit: production vs. full" above.
- **CodeQL** (`.github/workflows/codeql-analysis.yml`): scans `develop` weekly.
- **Performance audit**: advisory on both hosts, compared against
  `perf/baseline.github.json` or `perf/baseline.gitlab.json`. On GitHub the `perf-audit` label on a
  pull request starts it. A push to `develop` also runs it with the baseline
  refresh switched on, and opens a pull/merge request when the numbers moved,
  so a later pull request's audit is never diffed against a fix that already
  merged. Counts (backend requests, API calls after load, discarded nodes,
  payload) compare across machines. Lighthouse scores do not. See
  `scripts/perf-audit/README.md`.

## examples/drupal local dev

`examples/drupal` is the minimal Umami dev backend (D11, demo_umami, the
Druxt stack, `/en`+`/es`, the examples' OAuth consumer). Its local/CI
workflow is Docker-free: PHP's built-in server plus a throwaway SQLite
database (`examples/drupal/.devtools/`, `make build`); a
`examples/drupal/.ddev/config.yaml` provides the DDEV alternative locally. `test-e2e`
uses the Docker-free path, pinned to PHP 8.3. `demo_umami` provisions
its demo content in English and Spanish, and
`examples/druxt-site/test/cypress/e2e/nuxt/multilingual.cy.js` runs
against this backend in CI. Provision checks that the translations landed
(a note locally, fatal under CI, `REQUIRE_TRANSLATIONS` overrides either);
the provisioned database is per-checkout, override with `DB_FILE`. See `examples/drupal/.devtools/README.md` for how the SQLite
path works. The full druxtjs.org backend (Tome, curated translations)
lives in [druxt/druxtjs.org](https://github.com/druxt/druxtjs.org);
DDEV-based full-site setups live in the `quickstart` repo, not here.

## Reference

- [druxtjs.org](https://druxtjs.org): docs site
