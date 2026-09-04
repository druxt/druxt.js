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

`.devcontainer/devcontainer.json` provides a ready environment with Node 16 and Yarn via corepack. Monorepo and documentation dependencies install on first open.

[![Open in DevPod!](https://devpod.sh/assets/open-in-devpod.svg)](https://devpod.sh/open#https://github.com/druxt/druxt.js)

1. Open the fork in the tool of your choice:
   - **VS Code**: clone, open the folder, run **Dev Containers: Reopen in Container**.
   - **GitHub Codespaces**: on the repository page, **Code → Open with Codespaces**.
   - **[DevPod](https://devpod.sh)**: run `devpod up github.com/USER/druxt.js`, or add the same URL as a workspace source in DevPod's desktop app.
2. Wait for the post-create setup to finish, then build the packages: `yarn build`

The container covers package development, unit tests, linting and the documentation site. It does not provision a Drupal backend. Use the `docs/drupal` `.devtools` flow (below) or a [quickstart repository](https://github.com/druxt/quickstart) when you need one.

### Local development

1. Clone the forked repository to your local development environment. e.g., `git clone https://github.com/USER/druxt.js`
2. Set up the development environment: `make setup` (enables corepack and installs dependencies)
3. Build packages: `yarn build`
4. Start a Drupal backend (PHP 8.3 + SQLite, no Docker): `cd docs/drupal && .devtools/assemble && .devtools/provision && .devtools/start`
5. Run DruxtSite example: `yarn example:druxt-site`

> If `make` is not available, run `corepack enable && yarn install` manually instead of `make setup`. This project uses [Yarn Berry](https://yarnpkg.com/) via [corepack](https://nodejs.org/api/corepack.html), which requires Node 16.9 or later.

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

## Example projects

The Druxt monorepo contains a collection of example projects inside the `examples/` directory.

The example projects run against the locally built codebase, for testing during development.

All examples use the Drupal instance located @ `docs/drupal` (`cd docs/drupal && .devtools/assemble && .devtools/provision && .devtools/start`).

### druxt-site

An unstyled DruxtSite pattern index, including an eleven page `/examples/*` demonstration suite.

`yarn example:druxt-site`

### druxt-daisyui

A daisyUI-themed DruxtSite.

`yarn example:druxt-daisyui`

### druxt-tailwind

A Tailwind-themed DruxtSite.

`yarn example:druxt-tailwind`

### druxt-bootstrapvue

The Content Ops Console: a BootstrapVue editorial app with authenticated JSON:API writes.

`yarn example:druxt-bootstrapvue`

### node-client

A non-Nuxt example script showing DruxtClient and DruxtSchema in plain Node. Not a shipped tool. See [Use the Druxt client directly](https://druxtjs.org/how-to/use-the-druxt-client).

The reader-facing tour of these apps is [Explore the example apps](https://druxtjs.org/how-to/example-apps).

## Development tools

The Druxt repository is setup with tools and automated processes to help with development and to ensure a maintainable project:

- [Changesets](#changesets) - Changelog and versioning
- [Codecov](#codecov) - Automated code coverage
- [Conventional commits](#conventional-commits) - Standardised commit messages
- [Cypress](#cypress) - Automated end-to-end testing
- [Dev container](#dev-container) - Ready-made development environment
- [Docgen](#docgen) - Documentation generator
- [Jest](#jest) - Automated unit testing
- [Linting](#linting) - Coding styles and standards
- [Siroc](#siroc) - Zero-config build tools

### Changesets

Changesets is a tool to manage the mono-repo packages changelogs and versions.

If your changes are substantial, it is recommended to include a changeset. To do so, run the following command and follow the prompts:

```sh
yarn changeset
```

Be sure to commit your changeset file alongside your changes.

### Codecov

Codecov.io is used as part of the automated testing process to ensure that changes don't inadvertently reduce the overall code coverage of the project.

The coverage report is generated as part of the [Jest](#jest) testing:

```sh
yarn test:unit
```

- For more details, refer to the [Druxt Codecov.io report](https://app.codecov.io/gh/druxt/druxt.js)

### Conventional commits

> A specification for adding human and machine readable meaning to commit messages

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history, which makes it easier to write automated tools on top of.

A **husky** git hook is used to ensure the standard is enforced, and will explain what changes to make as required.

- For more details, refer to the [Conventional Commits documentation](https://www.conventionalcommits.org/).

### Cypress

Automated end-to-end testing is implemented using Cypress:

```sh
yarn test:e2e
```

- For more details, refer to the [Cypress documentation](https://docs.cypress.io/guides).

### Docgen

Druxt uses a custom Docgen module to generate API documentation from the package source code, using a combination of **JSDoc** and the **Vue Docgen API**.

To build your changed documentation, run the following command:

```sh
yarn build:docs
```

The documentation website is a Nuxt site located in the `/docs/nuxt` directory, to test your changes run the following command:

```sh
cd docs/nuxt && yarn dev
```

### Jest

Automated testing is implemented using Jest.

It is recommended to run Jest in **watch** mode when making changes:

```sh
yarn test:unit --watch
```

Test files are located within the relevant packages `test` directories. E.g., `packages/druxt/test`

- For more details, refer to the [Jest documentation](https://jestjs.io/docs/getting-started).

### Linting

Code styles and standards are enforced by linting tools, including **ESLint**.

**Husky** is used to trigger linting via a `pre-commit` git hook to ensure all issues are flagged before they are committed.

You can also manually run linting using the following command:

```sh
yarn lint
```

### Siroc

> Zero Config Build Tool

Siroc is the build tool used for the Druxt mono-repo, used to compile the source code and build the required packages.

To build your changes, run Siroc using the following command:

```sh
yarn build --watch
```

_Note: currently Siroc does not watch the Vue components for changes, you will need to manually re-run the command as required._
