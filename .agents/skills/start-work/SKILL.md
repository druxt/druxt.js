---
name: start-work
description: Sets up a druxt.js change before the first edit, from the issue to a feature branch off develop, a short spec and a failing test. Use when starting work on an issue, bug or feature in druxt.js, or when asked to change package code and no branch or issue exists yet.
---

# Start work

Every change to druxt.js goes through the same steps, whoever writes it. Do them in order and stop at a step that needs the person you work for.

## 1. Find or open the issue

Search the open and closed issues on [druxt/druxt.js](https://github.com/druxt/druxt.js/issues) for the problem first. If one exists, work from it. If none does, draft one from the matching template in `.github/ISSUE_TEMPLATE/` and ask the person you work for to open it, or open it yourself when they have asked you to.

## 2. Branch from develop

`develop` is the integration branch. `main` takes release merges only.

```bash
git remote -v          # upstream = druxt/druxt.js, origin = your fork
git fetch upstream develop
git checkout -b feature/<issue>-<short-description> upstream/develop
```

On a clone of druxt/druxt.js itself there is no fork, so use `origin` in place of `upstream`. The branch prefix is `feature/` for fixes and features alike, never `feat/`.

## 3. Write the spec

Skip this for a one-line fix. For anything larger, write a spec in the issue or the pull request description and get it signed off before writing code:

```markdown
## Goal

One sentence: what this changes for a Druxt user.

## Acceptance criteria

- Specific and testable.

## In scope

## Out of scope

## Open questions
```

Out of scope lists what you will leave alone. Keep to it, and raise anything new as a question or a follow-up issue.

## 4. Write the failing test first

Unit tests sit in each package's `test/` directory, beside the source they cover (such as `packages/router/test/router.test.js`). Write the test, then run it and watch it fail for the reason you expect:

```bash
yarn test:unit packages/router
```

A test that passes before the fix does not test the fix.

## Ground rules

- The toolchain is pinned to Node 16, Yarn 3, Vue 2.7, Nuxt 2, jest 29 and eslint 7. Leave it alone unless the issue is the upgrade itself.
- Druxt components use the Vue 2 Options API. Advice written for Vue 3 or Nuxt 3/4 (`<script setup>`, composables, Nitro) does not apply here.
- Commits follow Conventional Commits, scoped by package name: `fix(router): …`.
- Every `@param` in JSDoc needs a `{type}` and a `- description`. The JSDoc is the published API reference.

Next, write the change, then use the `add-changeset` skill if a published package changed, and the `verify-change` skill before opening a pull request.
