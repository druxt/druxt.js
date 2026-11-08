# AGENTS.md

The druxt.js Nuxt/Vue monorepo, the fully decoupled Drupal frontend
framework. Druxt = DRUpal + nUXT. Repository:
[github.com/druxt/druxt.js](https://github.com/druxt/druxt.js).

## Rules

Druxt welcomes AI-assisted contributions. They meet the same standards as any
other change: linted, tested, documented, reviewed, and merged through a pull
request. CI is the gate, and a person is accountable for every change.

- Work on a fork. Branch from the release line you are targeting, 0.x today,
  push to your fork, and open a pull request against that line on
  [druxt/druxt.js](https://github.com/druxt/druxt.js). The `start-work` and `open-pr`
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

## Druxt docs

Read the Druxt docs rather than relying on memory. The MCP server at
`https://druxtjs.org/mcp` is configured here for Claude Code, VS Code, Cursor
and OpenCode. Where a tool has no MCP support, use
`https://druxtjs.org/llms.txt`.

## Reproducible toolchain

This is the 2.0.x branch, Druxt 2 on Nuxt 4, Vue 3 and TypeScript. The 1.x
line (Nuxt 2) lives on the 0.x branch with its own toolchain; a fix crosses
between them by reimplementing it, not by merging.

Node and Yarn are pinned in `.mise.toml` and `package.json` `engines`. From a
fresh clone:

```bash
mise install          # activates Node 24 from .mise.toml
corepack enable       # enables the corepack shim (reads packageManager field)
yarn install          # uses Yarn 4.18.1 via corepack
yarn build            # builds every @druxt/* workspace, in dependency order
```

Keep one worktree per line: switching a checkout between 0.x and
2.0.x swaps Node 16 and Yarn 3 for Node 24 and Yarn 4, and every
`node_modules`.

Modules build with `@nuxt/module-builder`, `@druxt/client` with unbuild.
Each package's `exports` adds a `source` condition, so the typecheck reads
`src` while consumers get `dist`. A package joins the root `workspaces` list
when it is ported. Until then, its 1.x source stays in place, unbuilt.

## Commands

The full local verification gate, in order:

```bash
yarn lint && yarn build && yarn test
```

- `yarn build`: every `@druxt/*` workspace, topologically. With no workspace
  yet it builds nothing.
- `yarn test`: vitest. With no test file yet it passes with nothing to run.
- `yarn lint`: eslint, `@nuxt/eslint-config`
- `yarn lint:md` / `yarn lint:cspell` / `yarn lint:format`: markdownlint / cspell / prettier
- `yarn lint:renovate`: validate `renovate.json`
- `yarn lint:audit`: `yarn npm audit`, production dependencies only, fails on
  high/critical (the CI gate). `yarn lint:audit:full` includes devDependencies
  and is reporting-only.
- `yarn lint:knip`: [knip](https://knip.dev), unused files, exports and
  dependencies.

Before running an unfamiliar script, read it in `package.json`. Releases are
cut by CI, so leave the `version`, `changeset` and `release:*` scripts to it.
A hosted session may start from a shallow clone: run `git fetch --unshallow`
before drawing conclusions from the history, such as a merge base or the
commit that added a file.

## Inline documentation (JSDoc) → API docs

Every TypeScript and Vue source file's JSDoc is rendered by the docs generator (TypeDoc and
vue-component-meta, not on this line yet) into
Markdown that the [druxtjs.org](https://druxtjs.org) API reference renders
(the site itself now lives in [druxt/druxtjs.org](https://github.com/druxt/druxtjs.org);
this repo provides the generators). **The JSDoc you
write is the public documentation, verbatim** - there's no separate editing
pass, so a sloppy `@param` renders as a sloppy docs page.

The rule, and the reason it exists: **every `@param` line needs a
`- description`, with no exceptions**. In TypeScript the type comes from the
signature, so a `{type}` is not repeated. ESLint enforces it:
`jsdoc/require-param-description` and `jsdoc/check-param-names` are `error`
in `eslint.config.mjs`, so `yarn lint` fails on a bare `@param context.name`
and on a misnamed param.

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
type alias or interface (see `DruxtModuleSettings` and siblings in the module
contract types in core's runtime, or the `DruxtBlockVisibilityContext` that the
blocks module's `DruxtBlockRegion` component builds) over a half-documented
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
| [`open-pr`](.agents/skills/open-pr/SKILL.md)               | Open a pull request from a fork against the release line              |
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
  cases. It spends model tokens, so it runs locally only, not in CI. It
  needs Node 22 (`mise exec node@22 -- yarn skills:eval`) and your Claude
  Code login or `ANTHROPIC_API_KEY`. The config is
  `.agents/evals/promptfooconfig.yaml`.

Public Vue and Nuxt skills target Vue 3 and Nuxt 3/4 (Composition API,
`<script setup>`, Nitro). Druxt is Vue 2.7 and Nuxt 2 with the Options API, so
follow the patterns in the existing packages instead.

## Package layout

On 2.0.x every package is `@druxt/*`. The unscoped 1.x names stay with
the 1.x line, so the two never share an npm package.

| Path                  | npm name            | Role                                                                  |
| --------------------- | ------------------- | --------------------------------------------------------------------- |
| `packages/client`     | `@druxt/client`     | JSON:API client and auth, no framework                                |
| `packages/compat`     | `@druxt/compat`     | The 1.x API over the 2.x modules                                      |
| `packages/core`       | `@druxt/core`       | Nuxt module, `$druxt` plugin, DruxtModule base (1.x `packages/druxt`) |
| `packages/devtools`   | `@druxt/devtools`   | Development tools, no Vue, Nuxt or h3 dependency                      |
| `packages/blocks`     | `@druxt/blocks`     | Block region components                                               |
| `packages/breadcrumb` | `@druxt/breadcrumb` | Breadcrumb components                                                 |
| `packages/entity`     | `@druxt/entity`     | Entity/field components                                               |
| `packages/menu`       | `@druxt/menu`       | Menu components                                                       |
| `packages/router`     | `@druxt/router`     | Routing, path translation                                             |
| `packages/schema`     | `@druxt/schema`     | Schema generation                                                     |
| `packages/site`       | `@druxt/site`       | The whole site from Drupal                                            |
| `packages/views`      | `@druxt/views`      | Views components                                                      |

Drupal-side counterparts (`druxt`, `decoupled_router`, `jsonapi_menu_items`,
`jsonapi_views`, …) are separate drupal.org projects, not part of this repo.

## Branching

Each release line has its own branch, named for the minor it works towards:

- **0.x** is the current line. Feature branches and dependency pull requests
  start here and merge back here.
- 1.0.x and 2.0.x take the same shape once cut. A release is a tag on its
  line, not a branch, so there is no integration branch and nothing merges
  back.
- Renovate matches every release line at once
  (`baseBranches: ["/^\\d+(\\.\\d+)?\\.x$/"]`). Changesets cannot. Its
  `baseBranch` in `.changeset/config.json` reaches `git merge-base`, which
  wants one ref, so a glob is rejected and both \*.x and 0.\* fail. Each
  release line sets its own, and the value here is the remote-tracking ref
  origin/0.x rather than a bare 0.x, because branching straight off the remote
  ref doesn't create a local branch and only the remote-tracking ref still
  resolves. A line still naming another branch fails on `changeset status` and
  on the interactive `yarn changeset` alike, with "Failed to find where HEAD
  diverged".

**2.x work branches from 2.0.x and merges back to it**, and changesets
there set `baseBranch: origin/2.0.x`. Large changes are merged as stacked merge requests
of under 100 files each, so a review tool sees every file.

When starting work, branch from the line you are targeting:

```bash
git checkout 0.x && git pull && git checkout -b feature/<issue>-<short-desc>
```

Branch prefix is `feature/`, not `feat/`. (The docs site's Lagoon project
keyed its branch previews on that prefix; the site now deploys from
[druxt/druxtjs.org](https://github.com/druxt/druxtjs.org), and the prefix
stays as this repo's convention.) This is unrelated to commit-message
`feat:` types (Conventional Commits), which stay as-is.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on Node 24, on a push to 2.0.x and on a pull
request based on 2.0.x or on a 2.0.x feature branch. Its jobs are `lint`, `lint-markdown`,
`lint-cspell`, `lint-knip`, `lint-changesets`, `lint-commits`, `test` (the unit tests, after
`yarn build`) and `release-check` (the release script tests). GitLab CI (`.gitlab-ci.yml`) runs
the same checks under its own job names, and adds the JSON, shell, YAML, prose and skills lints,
the dependency audit (`yarn npm audit`, blocking for production dependencies and reporting only
for the full tree, for the reason given above `lint:dependency-audit`), gitleaks secret
detection and the manual `vscode:tunnel` job. CodeQL (`.github/workflows/codeql-analysis.yml`)
scans each release line on push and pull request, and weekly. The performance audit and release
workflows are 1.x's and are kept off 2.0.x.

## examples/drupal local dev

`examples/drupal` is the minimal Umami dev backend (D11, demo_umami, the
Druxt stack, `/en`+`/es`, the examples' OAuth consumer). Its local/CI
workflow is Docker-free: PHP's built-in server plus a throwaway SQLite
database (`examples/drupal/.devtools/`, `make build`); a
`examples/drupal/.ddev/config.yaml` provides the DDEV alternative locally. In CI the
standalone tests, which the test harness adds, provision it the Docker-free way, pinned to
PHP 8.3. `demo_umami` provisions
its demo content in English and Spanish, and
a standalone test of the compat example, which comes with the examples' port,
renders the druxt-site example's English and Spanish front pages against this
backend. Provision checks that the translations landed
(a note locally, fatal under CI, `REQUIRE_TRANSLATIONS` overrides either);
the provisioned database is per-checkout, override with `DB_FILE`. See `examples/drupal/.devtools/README.md` for how the SQLite
path works. The full druxtjs.org backend (Tome, curated translations)
lives in [druxt/druxtjs.org](https://github.com/druxt/druxtjs.org);
DDEV-based full-site setups live in the `quickstart` repo, not here.

## Reference

- [druxtjs.org](https://druxtjs.org): docs site
