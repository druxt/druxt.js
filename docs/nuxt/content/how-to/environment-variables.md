---
title: Environment variables
weight: 2
description: 'Every variable a Druxt build reads, where it comes from, and the build-time vs runtime distinction that catches people out.'
---

One page for every environment variable, so other guides can link here
instead of repeating themselves. The quickstart writes its variables to
a `.env` file, which Node does not read on its own: the quickstart's
`nuxt.config.js` loads it with the `dotenv` package
(`require('dotenv').config()`) and then reads plain `process.env`
values. Deployment platforms skip the file and inject their settings as
real environment variables. `.env` stays out of git; commit a
`.env.example` with placeholders instead.

## The variables

| Variable          | Consumed by                        | Purpose                                                                                                                                                                                                       |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`        | `nuxt.config.js` → `druxt.baseUrl` | The Drupal origin, scheme included and trimmed of any trailing slash. Must be reachable from wherever the consuming code runs. [Request topology](/explanation/request-topology#baseurl-rules) has the rules. |
| `OAUTH_CLIENT_ID` | `druxt-auth`                       | The consumer id created in Drupal for the login flow.                                                                                                                                                         |
| `NUXT_TARGET`     | `nuxt.config.js` → `target`        | `static` for generated builds, unset for the node server. One config file serves both modes.                                                                                                                  |
| `PORT`, `HOST`    | The dev and node servers           | Where the frontend listens.                                                                                                                                                                                   |
| `NODE_OPTIONS`    | Node itself                        | `--openssl-legacy-provider` for building on Node 17 or later ([why](/how-to/troubleshooting#error0308010cdigital-envelope-routines-on-node-17-or-later)).                                                     |

A copyable template:

```sh
# .env
BASE_URL=https://cms.example.com
OAUTH_CLIENT_ID=
# NUXT_TARGET=static
```

Never commit real secrets; keep per-environment values in the
platform's settings, and put anything sensitive only there.

## Build time vs runtime

**Nuxt 2 bakes `process.env` values into the bundle at build time.** A
`baseUrl` read from `BASE_URL` in `nuxt.config.js` is fixed at the moment
you run `nuxt build` or `nuxt generate`. Changing the variable on the
server later has no effect until the next build.

This is the most common deployment trap: one build promoted
through staging and production keeps talking to the backend it was built
against. The options:

- **One build per environment**, each built with its own `BASE_URL`.
  Simple, and the only option for generated static sites, since their
  pages are rendered against one backend by definition.
- **Runtime config** for server deployments: values under
  `publicRuntimeConfig` and `privateRuntimeConfig` in `nuxt.config.js`
  are read when the server starts, not when it was built, and code
  reads them through `this.$config` (such as `this.$config.baseUrl`)
  instead of `process.env`. Use
  `publicRuntimeConfig` for values the browser may see and
  `privateRuntimeConfig` for server-only secrets (service accounts,
  API keys used in server middleware).

The build machine and the visitor's browser both use `baseUrl`, and
they may not be able to reach the same address. See
[Request topology](/explanation/request-topology#baseurl-rules) for the
layouts that resolve this.

## Where to go next

- [Deploy a static site](/how-to/deploy-static): where these variables
  get set on a host.
- [Prepare the Drupal backend](/how-to/prepare-the-backend): the Drupal
  side of `BASE_URL` and `OAUTH_CLIENT_ID`.
