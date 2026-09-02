---
title: Prepare the Drupal backend
weight: -8
description: 'Make an existing Drupal site Druxt-ready: modules, JSON:API settings, permissions and the minimum content the frontend needs.'
---

The [quickstart](/tutorials/getting-started) provisions a ready-made
backend. This guide is for the other case: pointing Druxt at a Drupal site
you already have, or building the backend by hand.

## Install the Druxt module

```sh
composer require drupal/druxt
drush pm:enable druxt
```

The module depends on core's `jsonapi` module and three contrib projects:
[Decoupled Router](https://www.drupal.org/project/decoupled_router),
[JSON:API Menu Items](https://www.drupal.org/project/jsonapi_menu_items)
and [JSON:API Views](https://www.drupal.org/project/jsonapi_views).
Composer downloads them with the module, and enabling `druxt` enables all
of them. Drupal core `8.8` through `11` is supported.

If composer refuses with a stability error, your project's
`minimum-stability` is stricter than a dependency's current release.
Require the module with an explicit constraint first, for example
`composer require drupal/druxt:^1.0`, and only lower `minimum-stability`
as a last resort.

## Grant the permission

Grant **Access DruxtJS JSON:API resources** (`access druxt resources`) to
every role the frontend connects as. For a public site that is the
**Anonymous** role:

```sh
drush role:perm:add anonymous 'access druxt resources'
```

The permission grants read-only (GET) access to the configuration
resources the frontend needs to build itself: entity view and form
displays, field configuration, menus, menu links and views. Without it,
every one of those requests returns 403, and the errors name the
underlying resource rather than the permission, which makes the cause hard
to spot. See
[Troubleshooting](/how-to/troubleshooting#every-jsonapi-request-403s-even-for-content-that-should-be-public).

It grants nothing else: content entities keep their normal Drupal access
rules. Granting it to Anonymous exposes structure (display and field
configuration), not content that Drupal would otherwise protect. If that
trade-off is not acceptable, connect as an authenticated consumer instead
and see the topology notes on
[cookies and sessions](/explanation/request-topology#cookies-and-sessions).

## Check the JSON:API settings

Core's JSON:API defaults to read-only mode. Reads are all Druxt needs to
render a site, but form submissions through `DruxtEntityForm` are JSON:API
writes and will fail with 405 responses until writes are enabled:

```sh
drush config:set jsonapi.settings read_only 0
```

Leave `read_only` enabled if the site never writes through the API.

## Have some content and displays

The frontend builds its [schemas](/explanation/schemas) from entity view
and form displays at build time. A site with no content types produces no
schemas, and the build fails with a misleading `./schemas not found`
error. At minimum, create one content type before the first frontend
build. The Druxt module creates missing view displays for new bundles
automatically.

Display changes made after the frontend starts need a rebuild or dev
server restart to appear. See
[Troubleshooting](/how-to/troubleshooting#i-changed-a-drupal-display-and-nothing-happened-on-the-frontend).

## Commonly added modules

Not required, but production Druxt sites regularly add these:

| Module | Why |
| ------ | --- |
| [JSON:API Extras](https://www.drupal.org/project/jsonapi_extras) | Rename or re-prefix the API path (pair with Druxt's `endpoint` option, e.g. `endpoint: '/api'`), disable unused resources. |
| [JSON:API Image Styles](https://www.drupal.org/project/jsonapi_image_styles) | Expose image style URLs so the frontend can use derivatives instead of original files. |
| [Redirect](https://www.drupal.org/project/redirect) | Legacy URL redirects, resolved through the decoupled router. |
| [Simple XML sitemap](https://www.drupal.org/project/simple_sitemap) | Generate the sitemap on the backend; serve or proxy it from the frontend. |
| [m4032404](https://www.drupal.org/project/m4032404) and [r4032login](https://www.drupal.org/project/r4032login) | Sane 403/404 semantics for decoupled route resolution. |

Decoupled Router's `absolute_resolved_urls` setting is worth enabling so
resolved routes carry absolute URLs.

## Cross-origin access

If the frontend and backend are served from different origins, decide
between configuring CORS in Drupal and proxying browser requests through
the frontend before you deploy. [Request
topology](/explanation/request-topology) explains the difference;
[Configure CORS](/how-to/configure-cors) and
[Proxy the backend](/how-to/proxy) are the two implementations.

## Checklist

| Item | Command or place |
| ---- | ---------------- |
| Druxt module installed and enabled | `composer require drupal/druxt` + `drush pm:enable druxt` |
| Permission granted to the connecting role | `drush role:perm:add anonymous 'access druxt resources'` |
| JSON:API writes, if forms are used | `drush config:set jsonapi.settings read_only 0` |
| At least one content type with a display | Drupal admin |
| CORS or proxy decided | [Request topology](/explanation/request-topology) |
