---
title: Configure CORS in Drupal
weight: -7
description: Allow the browser to talk to the backend directly by serving CORS headers from Drupal, instead of proxying through the frontend.
---

> **Before you start:** read [Request
> topology](/explanation/request-topology) to confirm CORS is what you
> need. Only browser requests are subject to CORS; build and server
> rendering failures have other causes.

When the frontend and backend are on different origins, the browser blocks
cross-origin JSON:API requests unless Drupal answers with CORS headers.
This is the direct fix. The alternative, [proxying through the
frontend](/how-to/proxy), avoids CORS but only works while a Nuxt server
is running. A generated static site needs CORS.

The Druxt Drupal module enables CORS when it is otherwise disabled,
which covers anonymous reads because Drupal core's stock configuration
allows every origin. The module does not set the allowed methods, so
preflighted requests (form submissions, and any request carrying an
`Authorization` header) can still fail until you configure the block
below explicitly. Explicit configuration always wins, and is what
production sites should run.

## Enable cors.config

Drupal core includes the configuration, disabled, in
`sites/default/default.services.yml`. Copy the file to
`sites/default/services.yml` if it does not exist, and set the
`cors.config` block:

```yaml
parameters:
  cors.config:
    enabled: true
    allowedHeaders: ['*']
    allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
    allowedOrigins: ['https://www.example.com']
    exposedHeaders: false
    maxAge: 1000
    supportsCredentials: false
```

Then rebuild caches:

```sh
drush cache:rebuild
```

The keys to get right:

- `allowedOrigins` is your frontend origin, scheme included, no trailing
  slash. List each environment that needs access (production, previews,
  `http://localhost:3000`, the Nuxt dev server's default, for local
  development), or use `['*']` while
  developing. Never deploy `'*'` together with credentials support.
- `allowedMethods` needs more than GET only if the site writes through
  JSON:API (forms). `OPTIONS` must stay: browsers send it as the
  preflight.
- `supportsCredentials` stays `false` for anonymous reads. Set it `true`
  only for credentialed flows, in which case `allowedOrigins` must list
  explicit origins, never `'*'`, and `allowedHeaders` must name the
  headers your requests use, such as
  `['Authorization', 'Content-Type', 'Accept']`: the wildcard does not
  cover non-safelisted headers on credentialed requests, and
  `Authorization` always needs an explicit entry.

## Verify

Ask Drupal for a resource with an `Origin` header, and check the
response:

```sh
curl -s -o /dev/null -D - -H "Origin: https://www.example.com" \
  https://cms.example.com/jsonapi | grep -i access-control
```

That covers simple reads. Requests with non-simple methods or headers
(writes, `Authorization`) go through an `OPTIONS` preflight, so test
that too, and check the allow-origin, allow-methods and allow-headers
values that come back:

```sh
curl -si -X OPTIONS \
  -H "Origin: https://www.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  https://cms.example.com/jsonapi | grep -i access-control
```

A working configuration answers with
`access-control-allow-origin: https://www.example.com`. No
`access-control-*` headers at all means the block is not loading: confirm
the file is `sites/default/services.yml`, the site was cache-rebuilt, and
your hosting platform does not strip the headers.

## Per-environment configuration

Origins differ per environment, and `services.yml` is not part of config
sync. A clean pattern used by production Druxt sites: keep a
`services.yml` per environment (say
`sites/default/envs/<env>/services.yml`) and include the right one from
`settings.php`, so development can stay permissive while production lists
exact origins.

## When to prefer the proxy

| Situation                               | Use                                                              |
| --------------------------------------- | ---------------------------------------------------------------- |
| Generated static site (`nuxt generate`) | CORS. The proxy would need a server.                             |
| Nuxt server, one frontend origin        | Either. The [proxy](/how-to/proxy) leaves the backend untouched. |
| Several frontends sharing one backend   | CORS, with each origin listed.                                   |
| You cannot change the backend           | The proxy, and a server-rendered deployment.                     |
