---
title: Troubleshoot common issues
weight: 2
description: Quick answers to the errors and gotchas that come up most often.
---

> **Before you start:** this guide assumes a working Druxt site. See
> [Getting started](/tutorials/getting-started).

This page covers the three issues that account for most of the confusion
reported by real users over the life of this project. Each entry below is a
quick answer with a link to the fuller explanation.

---

## "Missing Vue template" box

**You're not seeing an error, this is expected.** `DruxtBlock` and
`DruxtField` both show this box when nothing themes them yet (other modules
don't have it), and it **only appears in development mode** (`nuxt dev`).
Production builds show nothing there instead.

Expand the box: it lists every valid wrapper name for that component and has
a **Create** button that scaffolds the file for you. See [Theme Druxt
components](/how-to/theming#missing-vue-template-box) for the full
explanation and how the wrapper-naming system works.

## I changed a Drupal display and nothing happened on the frontend

Schemas (the field lists and formatters that drive rendering) are generated
**once, when `nuxt dev` starts** (not per-request). Rearranging fields,
changing a formatter, or adding a view mode in Drupal won't reach the
frontend until you **restart the Nuxt dev server**. Content changes update
live; display-mode changes don't, because they go through a completely
different path. See [The schema system](/explanation/schemas#schemas-are-generated-once-at-startup)
for why.

## Every JSON:API request 403s, even for content that should be public

Druxt gates all of its JSON:API access behind one Drupal permission:
**`access druxt resources`**. Without it, requests can fail in ways that
don't obviously point at that permission. Errors instead reference whatever
the underlying JSON:API resource would normally require (e.g. entity
display-related admin permissions) rather than the Druxt permission itself.
If JSON:API access fails site-wide right after installing the Druxt module,
check **Drupal → People → Permissions** for **access druxt resources**
before debugging anything else. The [quickstart](/tutorials/getting-started)
grants this automatically. Installing Druxt on an existing site does not.
See the [`druxt` module reference](/modules/druxt#installation) for the
full installation steps.

## Where to go next

- [Theme Druxt components](/how-to/theming): wrapper components in full.
- [The schema system](/explanation/schemas): how schemas are built and cached.
- [`druxt` module reference](/modules/druxt): installation and permissions.
