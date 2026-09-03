---
title: Troubleshoot common issues
weight: 2
description: Quick answers to the problems reported most often by real users, from the missing Vue template box to site-wide JSON:API 403 failures.
---

> **Before you start:** this guide assumes a working Druxt site. See
> [Getting started](/tutorials/getting-started).

This page covers the issues that account for most of the confusion
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

## "…has been blocked by CORS policy" in the browser console

The browser is refusing a cross-origin request to Drupal. Only requests
made **by the browser** can fail this way; if the site server-renders fine
and breaks on navigation or dynamic data, this is why. Two fixes, pick
one: [configure CORS in Drupal](/how-to/configure-cors) so the backend
answers cross-origin requests, or [proxy the API through the
frontend](/how-to/proxy) so no request is cross-origin (server deployments
only). [Request topology](/explanation/request-topology) explains when
each applies.

## The build fails reaching the backend (ECONNREFUSED, timeouts, 400s)

`nuxt build` and `nuxt generate` fetch schemas and content from Drupal
**from the machine running the build**. A `baseUrl` that works in your
browser can still be unreachable from the build: `localhost` inside a
container is the container itself, a Docker hostname does not resolve
outside its network, and a backend behind basic auth or a VPN blocks the
build the same way. Confirm with `curl <baseUrl>/jsonapi` from the build
environment. CI setups should wait for the backend to answer before
starting the build. See [Request
topology](/explanation/request-topology#baseurl-rules).

## The site only shows "Welcome to Nuxt"

The Nuxt scaffolder creates a default `pages/index.vue`, and an explicit
page always wins over Druxt's wildcard route. Delete `pages/index.vue`
and the homepage resolves through Drupal like every other path. See
[Decoupled routing](/explanation/routing).

## Build error: the pages directory is missing

Nuxt requires a `pages/` directory even when Druxt's wildcard router
provides every route. Create it with a placeholder:
`mkdir pages && touch pages/.gitkeep`.

## Composer refuses to install drupal/druxt

A stability error (`minimum-stability`) means a dependency's current
release is below your project's floor. Require an explicit constraint,
for example `composer require drupal/druxt:^1.0`, before loosening
`minimum-stability`. See [Prepare the Drupal
backend](/how-to/prepare-the-backend).

## "require() of ES Module axios" crash on a fresh install

Nuxt 2's webpack 4 resolves newer axios releases through their ESM
entry, which its CommonJS server build cannot load. Pin axios to a 0.x
release, or transpile it:

```js
export default {
  build: {
    transpile: ['axios'],
  },
};
```

## "error:0308010C:digital envelope routines" on Node 17 or later

Node 17 moved to OpenSSL 3, which rejects the legacy hashing algorithms
Nuxt 2's webpack 4 relies on. Either build on Node 16, or enable the
legacy provider in the build environment:

```sh
NODE_OPTIONS=--openssl-legacy-provider nuxt build
```

This also works in CI and static-host build settings by prefixing the
build command.

## Builds fail on Windows

Nuxt 2 tooling and several Druxt build steps have known problems on
native Windows (path separators, OpenSSL differences). Use
[WSL2](https://learn.microsoft.com/windows/wsl/) and run everything
inside the Linux environment; that is the tested and recommended setup.

## Where to go next

- [Theme Druxt components](/how-to/theming): wrapper components in full.
- [The schema system](/explanation/schemas): how schemas are built and cached.
- [`druxt` module reference](/modules/druxt): installation and permissions.
