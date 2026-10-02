---
name: triage-issue
description: Sorts a druxt.js issue by type and package, and reproduces it against the example Drupal backend or with a failing unit test before writing up the findings. Use when a new or unclear druxt.js issue needs sorting, reproducing or a next step, or when asked whether a reported bug is real.
---

# Triage an issue

The output of triage is a short written report. Labels, milestones and closing issues are for maintainers, so recommend them and leave the change to a maintainer.

## 1. Read and classify

Read the issue and its comments. Decide which it is:

- **Bug**: a package behaves differently from its documentation or from a previous release.
- **Feature request**: new behaviour.
- **Support question**: how to use Druxt. Point to [druxtjs.org](https://druxtjs.org) or the matching how-to.
- **Drupal side**: the problem is in a Drupal module such as `druxt`, `decoupled_router`, `jsonapi_menu_items` or `jsonapi_views`. Those live on drupal.org, not in this repository.

Search open and closed issues for duplicates, and link any you find.

## 2. Find the package

Map the report to a package in `packages/`, using the package table in `AGENTS.md`. Note the version the reporter uses and check `packages/<package>/CHANGELOG.md` for a fix released since.

## 3. Reproduce

Reproduce the bug on `develop`, in the smallest way available:

1. A failing unit test in the package's `test/` directory, run with `yarn test:unit packages/<package>`. This is the best reproduction, because it becomes the regression test.
2. The example apps against the local Drupal backend:

   ```bash
   cd examples/drupal && make build
   yarn example:druxt-site
   ```

   The backend is a minimal Umami site with English and Spanish content. See `examples/drupal/.devtools/README.md`.

If it does not reproduce, ask for what is missing, such as the Druxt package and Nuxt versions, the Drupal core and module versions, the module configuration in `nuxt.config.js`, the JSON:API response involved, or a minimal reproduction repository.

## 4. Report

Write the triage up in this shape:

```markdown
**Type:** bug | feature | support | drupal-side
**Package:** druxt-<name> <version>
**Duplicate of:** #<n> (or none found)
**Reproduced:** yes | no | not attempted (steps, or what is missing)
**Likely cause:** <file and line, if found>
**Suggested labels:** <labels>
**Next step:** <a fix and its test, a question for the reporter, or close>
```

Post it on the issue only when the person you work for asks you to. To fix the bug, continue with the `start-work` skill.
