---
title: Contributing
weight: 9
description: Set up the Druxt development environment, report bugs, and submit changes with changesets and conventional commits.
---

> Contributions are welcomed and appreciated.

Druxt is an open source project, built, supported and maintained by the community, for the community.

## Development environment setup

The Druxt development environment can be run in a dev container (VS Code, GitHub Codespaces, DevPod) or locally:

First, fork [druxt/druxt.js](https://github.com/druxt/druxt.js) on GitHub,
giving you `https://github.com/USER/druxt.js` to work from.

### Dev container

`.devcontainer/devcontainer.json` provides a ready environment with Node 24 and Yarn via corepack. Monorepo dependencies install on first open.

[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/druxt/druxt.js)

1. Open the fork in the tool of your choice:
   - **VS Code**: clone, open the folder, run `Dev Containers: Reopen in Container`.
   - **GitHub Codespaces**: on the repository page, **Code → Open with Codespaces**.
   - **[DevPod](https://devpod.sh)**: run `devpod up github.com/USER/druxt.js`, or add the same URL as a workspace source in DevPod's desktop app.
2. Wait for the post-create setup to finish, then build the packages: `yarn build`

The container covers package development, unit tests and linting. It does not provision a Drupal backend. Use the `examples/drupal` `.devtools` flow (below) or a [quickstart repository](https://github.com/druxt/quickstart) when you need one.

### Local development

1. Clone the forked repository to your local development environment. e.g., `git clone https://github.com/USER/druxt.js`
2. Set up the development environment: `make setup` (enables corepack and installs dependencies)
3. Build packages: `yarn build`
4. Start a Drupal backend (PHP 8.3 + SQLite, no Docker): `cd examples/drupal && make build` (or `.devtools/assemble && .devtools/provision && .devtools/start`)
5. Run the tests: `yarn test` doesn't need a backend, and the standalone tests run against it: `DRUXT_BASE_URL=http://127.0.0.1:8888 yarn test:standalone`

> If `make` is not available, run `corepack enable && yarn install` manually instead of `make setup`. This project uses [Yarn](https://yarnpkg.com/) 4 via [corepack](https://nodejs.org/api/corepack.html), on Node 24.

## Bug reports, feature requests

One of the easiest ways to contribute to Druxt is to open issues, giving as much detail as possible to make it easier for other contributors and maintainers: [open an issue](https://github.com/druxt/druxt.js/issues/new/choose)

When reporting bugs please make sure to provide detailed steps to reproduce the issue, and when possible provide a minimal reproduction (a repo or snippet that triggers the bug).

## Pull requests

To resolve an issue or propose an improvement, use the following process to create a pull request:

1. If this a new issue, make sure to open a bug report or feature request.
2. Fork the repository.
3. Setup a development environment (see [steps above](#development-environment-setup)).
4. Make a `feature/#` branch from the `develop` branch.
5. Make and commit your changes.
6. Create a Pull request: https://github.com/druxt/druxt.js/compare

## AI-assisted contributions

Druxt welcomes contributions written with AI coding agents. They go through the same process as any other change: an issue, a branch from `develop`, linting, tests, documentation, a pull request and review. CI checks every pull request the same way, and the person who opens the pull request is accountable for it.

The repository is set up for agents:

- [`AGENTS.md`](AGENTS.md) holds the project instructions. Claude Code (v2.1.277 or later), Codex, Cursor, Gemini CLI, Copilot and OpenCode read it directly.
- Contributor skills in [`.agents/skills/`](.agents/skills) cover the project workflow: starting work, changesets, verification, pull requests, review and issue triage. `.claude/skills` links to the same directory for Claude Code. The table in `AGENTS.md` lists them.

A few things to know:

- **Claude Code reads `AGENTS.md` only when the project has no `CLAUDE.md` or `CLAUDE.local.md`.** If you keep a personal `CLAUDE.local.md`, or run a Claude Code version older than v2.1.277, put `@AGENTS.md` on its first line.
- **On Windows**, `.claude/skills` is a symlink. Clone with `git clone -c core.symlinks=true` (which needs Developer Mode or an administrator shell), or Claude Code finds no skills.
- **Workflow plugins are optional.** [superpowers](https://github.com/obra/superpowers) adds planning, test-driven development and review skills. Install it at user scope if you want it, since the repository does not depend on it.
- **Commits are yours.** Commit under your own git `user.name` and `user.email`, with no AI attribution lines in the message. The `commit-msg` and `pre-push` hooks and CI refuse a commit made under an agent's identity (Claude, Cursor, Copilot, Codex) or crediting one. `.claude/settings.json` turns off Claude Code's own commit and pull request attribution.
- **Claude Code on the web** runs `.claude/hooks/session-start.sh` when a session starts. It installs the pinned Node and Yarn (Yarn from the npm registry, because hosted sessions can't reach corepack's download host), runs `yarn install`, which also installs the git hooks, and builds the packages so the unit tests can run. On your own machine the hook does nothing: use `mise install` and `make setup`.
- **OpenCode** finds the skills in both `.agents/skills/` and the `.claude/skills` symlink, and logs a duplicate-name warning for each. Set `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` to have it read `.agents/skills/` only.
- **Skills are tested.** `yarn lint:skills` ([agnix](https://github.com/agent-sh/agnix)) runs in CI and before each commit that changes a skill. `yarn skills:eval` ([promptfoo](https://www.promptfoo.dev)) runs each skill's evals with your own Claude login, locally only, so CI spends no model tokens. The `write-skill` skill covers adding or changing one.

## Example projects

The Druxt monorepo contains a collection of example projects inside the `examples/` directory.

The example projects run against the locally built codebase, for testing during development. They are not ported to the 2.x line yet, so the root `example:*` scripts that started each one are gone until they are.

All examples use the Drupal instance located at `examples/drupal` (`cd examples/drupal && make build`), a minimal Umami install. The full druxtjs.org site backend (translations, Tome content) lives in [druxt/druxtjs.org](https://github.com/druxt/druxtjs.org).

### druxt-site

An unstyled DruxtSite pattern index, including an eleven page `/examples/*` demonstration suite.

### druxt-daisyui

A daisyUI-themed DruxtSite.

### druxt-tailwind

A Tailwind-themed DruxtSite.

### druxt-bootstrapvue

The Content Ops Console is a BootstrapVue editorial app with authenticated JSON:API writes.

### node-client

A non-Nuxt example script showing DruxtClient and DruxtSchema in plain Node. It is not a published tool. See [Use the Druxt client directly](https://druxtjs.org/how-to/use-the-druxt-client).

The reader-facing tour of these apps is [Explore the example apps](https://druxtjs.org/how-to/example-apps).

## Development tools

The Druxt repository is setup with tools and automated processes to help with development and to ensure a maintainable project:

- [Changesets](#changesets) - Changelog and versioning
- [Codecov](#codecov) - Automated code coverage
- [Conventional commits](#conventional-commits) - Standardised commit messages
- [Dev container](#dev-container) - Ready-made development environment
- [API docs](#api-docs) - Documentation generator
- [Linting](#linting) - Coding styles and standards
- [Module builder](#module-builder) - Package builds
- [Performance audit](#performance-audit) - Backend requests, hydration and Lighthouse per example route
- [Vitest](#vitest) - Automated testing

### Changesets

Changesets is a tool to manage the mono-repo packages changelogs and versions.

If your changes are substantial, it is recommended to include a changeset. To do so, run the following command and follow the prompts:

```sh
yarn changeset
```

Be sure to commit your changeset file alongside your changes. `yarn lint:changesets` checks it against the project style, which the [add-changeset skill](.agents/skills/add-changeset/SKILL.md) describes, and `yarn lint:changesets --preview` prints the changelog it will produce.

The pull request that versions the packages publishes the release line's packages once it is merged. On `0.x`, each merged changeset also publishes a development release. The 2.0.x release flow is switched on before alpha.1. See [Releasing](RELEASING.md).

### Codecov

Codecov.io is used as part of the automated testing process to ensure that changes don't inadvertently reduce the overall code coverage of the project.

Coverage is not reported on the 2.x line yet.

- For more details, refer to the [Druxt Codecov.io report](https://app.codecov.io/gh/druxt/druxt.js)

### Conventional commits

> A specification for adding human and machine readable meaning to commit messages

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history, which makes it easier to write automated tools on top of.

A **husky** git hook is used to ensure the standard is enforced, and will explain what changes to make as required.

- For more details, refer to the [Conventional Commits documentation](https://www.conventionalcommits.org/).

### API docs

The API reference is generated from the package source code: **TypeDoc**
renders the exported API from the **TSDoc** comments and
**vue-component-meta** documents the components. The generator arrives with
the port of the docs package, and so does the command that runs it; there is
nothing to run on this line until then. The documentation website that
renders the output is at
[druxt/druxtjs.org](https://github.com/druxt/druxtjs.org); this repo provides
the generators, not the site.

### Linting

Code styles and standards are enforced by linting tools, including **ESLint**.

**Husky** runs git hooks so problems are caught before they reach GitHub:

- `pre-commit` lints the staged files with lint-staged (configured in `package.json`): ESLint, Prettier, markdownlint, CSpell, and agnix when a skill changes.
- `commit-msg` checks the message against Conventional Commits, and checks the commit is made under your own identity with no AI attribution.
- `pre-push` checks the commits being pushed the same way, then runs ESLint and the prose lint.

You can also manually run linting using the following command:

```sh
yarn lint
```

### Module builder

Each Nuxt module builds with [`@nuxt/module-builder`](https://github.com/nuxt/module-builder), and `@druxt/client` with unbuild:

```sh
yarn build
```

### Performance audit

The audit runs on the 1.x line. It returns to 2.x with the ported examples.

The performance audit builds the examples in production mode and measures each route: backend requests per server render, API calls after load, server-rendered components discarded after hydration, layout shift, inline payload and Lighthouse. It compares the run with a committed baseline.

It does not run on every pull request. A maintainer adds the `perf-audit` label, and the run comments a summary on it. Ask for the label when a change touches a store, the client, a Nuxt module or how components fetch. A merge to `develop` refreshes the committed baseline on its own, so the comment on your pull request never mixes in a fix that already merged.

In the comment, a lower number is an improvement. The counts are the same on every machine. The Lighthouse score and layout shift are not, and both can move between runs of the same code, so treat a small move in either as noise.

- For running it locally, the budgets and how to read the numbers, refer to the [Performance audit README](scripts/perf-audit/README.md).

### Vitest

`yarn test` runs the unit and component tests, against a fake Drupal. It doesn't need a backend.

Each module also has a standalone test that builds a real Nuxt 4 app with that module alone and renders Drupal content through it, so a module that only works when another installs it fails. The standalone tests need a Drupal backend, such as `examples/drupal`:

```sh
DRUXT_BASE_URL=http://127.0.0.1:8888 yarn test:standalone
```

On this branch `yarn test:standalone` runs only the backend's `/jsonapi` check, so a pass says the backend answers JSON:API, not that a module works alone. The module tests arrive with the packages.

- For more details, refer to the [Vitest documentation](https://vitest.dev/guide/) and [Nuxt's testing guide](https://nuxt.com/docs/getting-started/testing).
