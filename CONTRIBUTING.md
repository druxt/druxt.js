---
title: Contributing
weight: 5
---

> All contributions are welcomed and appreciated.

Druxt is an open source project, built, supported and maintained by the community, for the community.

* * *

## Bug reports, feature requests

One of the easiest ways to contribute to Druxt is to open issues, giving as much detail as possible to make it easier other contributors and maintainers: http://github.com/druxt/druxt.js/issues/new/choose

When reporting bugs please make sure to provide detailed steps to reproduce the issue, and when possible provide a Gitpod workspace snapshot to demonstrate the issue.

* * *

## Pull requests

If you are able to resolve an issue, or have improvements you would like to propose, use following process to create a Pull request:

1. If this a new issue, make sure to open a bug report or feature request.
2. Fork the repository.
3. Make a `feature/#` branch from the `develop` branch.
4. Make and commit your changes.
5. Create a Pull request: https://github.com/druxt/druxt.js/compare

* * *

## Example projects

The Druxt monorepo contains a collection of example projects inside the aptly named "examples/" directory.

All projects are connected to the locally built codebase and should be used for testing during development.

All examples use the Drupal instance located @ `docs/drupal` (`cd docs/drupal && ddev start && ddev drupal-install`).

### Custom module

This a a bare bones example of a custom DruxtModule.

`cd examples/custom-module && yarn && yarn dev`

### DruxtSite

This is an example of a basic, un-themed DruxtSite with support for authenticated users.

`yarn example:druxt-site`

### Entity form

A basic contact form example of the DruxtEntityForm component.

`cd examples/entity-form && yarn && yarn dev`

### Node client

A non-Nuxt example, using the DruxtClient in a basic node app.

`cd examples/node-client && yarn && yarn dev`

* * *

## Development tools

The Druxt repository is setup with tools and automated processes to help with development and to ensure a maintainable project:

- [Changesets](#changesets) - Changelog and versioning
- [Codecov](#codecov) - Automated code coverage
- [Conventional commits](#conventional-commits) - Standardised commit messages
- [Docgen](#docgen) - Documentation generator
- [Gitpod](#gitpod) - Cloud based IDE
- [Jest](#jest) - Automated testing
- [Linting](#linting) - Coding styles and standards
- [Siroc](#siroc) - Zero-config build tools

* * *

### Changesets

Changesets is a tool to manage the mono-repo packages changelogs and versions.

If your changes are substantial, it is recommended to include a changeset. To do so, run the following command and follow the prompts:

```sh
yarn changeset
```

Be sure to commit your changeset file alongside your changes.

* * *

### Codecov

Codecov.io is used as part of the automated testing process to ensure that changes don't inadvertantly reduce the overall code coverage of the project.

The coverage report is generated as part of the [Jest](#jest) testing:

```sh
yarn test
```

- For more details, refer to the [Druxt Codecov.io report](https://app.codecov.io/gh/druxt/druxt.js)

* * *

### Conventional commits

> A specification for adding human and machine readable meaning to commit messages

The Conventional Commits specification is a lightweight convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history; which makes it easier to write automated tools on top of.

A **husky** git hook is used to ensure the standard is enforced, and will explain what changes to make as required.

- For more details, refer to the [Conventional Commits documentation](https://www.conventionalcommits.org/).

* * *

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

* * *

### Gitpod

The easiest way to develop or test Druxt is via Gitpod, a cloud based IDE.

All dependencies are pre-installed and configured to get started with Druxt development.

Click the button below to get started:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/druxt/druxt.js)

* * *

### Jest

Automated testing is implemented using Jest.

It is recommended to run Jest in **watch** mode when making changes:

```sh
yarn test --watch
```

Test files are located within the relevant packages `test` directories. E.g., `packages/druxt/test`

- For more details, refer to the [Jest documentation](https://jestjs.io/docs/getting-started).

* * *

### Linting

Code styles and standards are enforced by linting tools, including **ESLint**.

**Husky** is used to trigger linting via a `pre-commit` git hook to ensure all issues are flagged before they are committed.

You can also manually run linting using the following command:

```sh
yarn lint
```

* * *

### Siroc

> Zero Config Build Tool

Siroc is the build tool used for the Druxt mono-repo, used to compile the source code and build the required packages.

To build your changes, run Siroc using the following command:

```sh
yarn build --watch
```

_Note: currently Siroc does not watch the Vue components for changes, you will need to manually re-run the command as required._
