---
title: Support and versioning
weight: 0
description: 'Druxt follows semantic versioning on a deliberately held stack. The promise, the end-of-life reality, and the path an API takes out of the framework.'
---

Druxt follows [semantic versioning](https://semver.org). This page states
what that promise covers: which stack 1.x supports, what a 1.x release
may and may not change, and how APIs leave the framework.

## The supported stack

The full compatibility table, with the known pins and workarounds, lives
with the [`druxt` module reference](/modules/druxt). The short version:

| Layer       | Supported                       |
| ----------- | ------------------------------- |
| Nuxt        | 2.15 or later, Nuxt 2 line only |
| Vue         | 2.7                             |
| Node        | 16, the tested version          |
| Drupal core | 10.1 through 11                 |

Nuxt 2, Vue 2 and Node 16 are all past their upstream end of life. That
is the honest shape of the 1.x line, and stating it plainly is the point
of this page: 1.x exists to give sites built on this stack a stable,
maintained base, not to chase new majors. Adopting a newer Nuxt is
2.0.0 territory, and the stack above does not change for the life of
1.x.

## What 1.0.0 means

- **No breaking changes inside 1.x.** Code written against 1.0.0 keeps
  working on every 1.x release.
- **Deprecation before removal.** An API scheduled for removal keeps
  working through the whole 1.x line, warns in the console when used,
  and is removed in 2.0.0.
- **Fixes keep coming.** The 1.x line receives bug and security fixes
  for the supported stack above.

## How deprecation works

A deprecated API logs a console warning at runtime naming its
replacement and linking a ledger entry, like this one:

```text
[druxt] The `hash` argument for `druxt/addResource` has been deprecated,
see https://druxtjs.org/modules/druxt/deprecations#druxtstore-addresource-hash
```

Each deprecation has a ledger entry stating what changed, the
replacement, and the removal version, in the package that owns it:

- [Druxt core deprecations](/modules/druxt/deprecations)
- [DruxtEntity deprecations](/modules/entity/deprecations)
- [DruxtMenu deprecations](/modules/menu/deprecations)
- [DruxtRouter deprecations](/modules/router/deprecations)

A quiet console in development means nothing on the removal list applies
to your site.

## Security

Report vulnerabilities privately through
[GitHub security advisories](https://github.com/druxt/druxt.js/security/policy);
do not open a public issue for them. The policy, response time and
supported-versions statement live in the repository's SECURITY.md.

## Where to go next

- [Upgrade a Druxt site](/how-to/upgrade): moving to 1.0.0, and using
  the warnings as your 2.0.0 to-do list.
- [`druxt` module reference](/modules/druxt): the full compatibility
  table.
