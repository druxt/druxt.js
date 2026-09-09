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

The Druxt Drupal module supplies CORS settings on a site that has not
configured them in `sites/default/services.yml`. Core ships the block
disabled and allows every origin, so on such a site Druxt turns CORS on,
and from `drupal/druxt` 1.3.0 it also fills `allowedHeaders` and
`allowedMethods` with `*`. Preflighted requests then work: form
submissions, and any request carrying an `Authorization` header.

Before 1.3.0 the module filled the headers and left the methods empty. An
empty list permits no method at all, so the browser never sent the
request. Anonymous reads still worked, which is why this went unnoticed:
a GET with no unusual headers is not preflighted. Every JSON:API write
is, because `application/vnd.api+json` is never a safelisted content
type, and so is every read carrying an `Authorization` header.

Upgrading fixes it, on an existing site as well as a new one: 1.3.0 sets
the default for new installs and runs an update hook for sites already
running Druxt. A site that had configured its own `allowedMethods` keeps
what it configured.

The running configuration will not tell you that you have the problem: it
reports `enabled: true` with an empty `allowedMethods`, because the older
module set the flag and stopped there.

Configure the block yourself and Druxt leaves all of it alone. That is
what production sites should run: `*` is the widest answer a browser will
accept, and your own origins and methods are narrower.

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

Read the headers, not the status. A preflight the browser will refuse
still answers `204 No Content` and still writes a normal line in the
access log, and `curl` does not enforce the answer the way a browser
does, so a request tested by hand succeeds while the same request from
the site fails. That is what makes this hard to attribute: the backend
looks healthy from every angle except the browser's.

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

## Where to go next

- [Proxy the Drupal backend through Nuxt](/how-to/proxy): the
  same-origin alternative when a server renders the frontend.
- [Request topology](/explanation/request-topology): which requests
  cross origins, and why only those need CORS.
- [Troubleshoot common issues](/how-to/troubleshooting): the CORS
  failures and their signatures.
