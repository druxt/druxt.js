---
title: Upgrade a Druxt site
weight: 8
description: Move a 0.x site to Druxt 1.0.0, then use deprecation warnings as the working to-do list for 2.0.0.
---

> **Before you start:** this guide assumes a working 0.x site. For what
> the version numbers promise, see
> [Support and versioning](/explanation/support-and-versioning).

## 0.x to 1.0.0

1.0.0 declares stability rather than changing behaviour: it is not a
breaking release, and a site current on the last 0.x releases upgrades
by bumping versions. Install every `druxt*` package your
`package.json` names at the new major explicitly; `npm update` respects
the existing 0.x ranges and would leave you where you started:

```sh
npm install druxt@^1.0.0 druxt-site@^1.0.0
```

Extend the command with each `druxt*` package you actually depend on; a
partial bump across druxt packages is the main thing to avoid. Then build and browse the
site in development mode:

```sh
npm run dev
```

## Read the warnings

Deprecated APIs keep working through every 1.x release, and each use
logs a console warning naming its replacement:

```text
[druxt] The `hash` argument for `druxt/addResource` has been deprecated,
see https://druxtjs.org/modules/druxt/deprecations#druxtstore-addresource-hash
```

Browse your site's main pages with the browser console open, and watch
the terminal running `npm run dev` for the server-side render. Each
warning links its ledger entry, which states the replacement and the
removal version:

- [Druxt core deprecations](/modules/druxt/deprecations)
- [DruxtEntity deprecations](/modules/entity/deprecations)
- [DruxtMenu deprecations](/modules/menu/deprecations)
- [DruxtRouter deprecations](/modules/router/deprecations)

## The 2.0.0 to-do list

Everything deprecated in 1.x is removed in 2.0.0, so the warnings you
just collected are your migration list, and each can be fixed now: the
replacements already work on 1.x. A site that renders warning-free today
has no code changes waiting in the removal queue.

## Where to go next

- [Support and versioning](/explanation/support-and-versioning): the
  policy behind this procedure.
- [Troubleshoot common issues](/how-to/troubleshooting): if the upgrade
  surfaces build errors unrelated to deprecation.
