---
title: Decoupled routing
weight: -7
description: Only Drupal knows which entity serves a path, so Druxt asks it, then turns that answer into a resource request and follows any redirect.
---

In a fully decoupled site the frontend handles the URL, but the content lives
in Drupal, and only Drupal knows which entity serves `/node/1`, or
`/recipes/super-easy-pasta`, or a redirect that moved last week. Druxt's
router module bridges the two worlds with **path translation**.

## Path translation

When the router receives a path, it asks Drupal's
[`decoupled_router`](https://www.drupal.org/project/decoupled_router)
module (via its `/router/translate-path` endpoint) one question: _what
serves this path?_ The answer is a normalized route object:

```js
{
  isHomePath: false,
  label: 'Hello Druxt',
  resolvedPath: '/node/1',
  entity: {
    entity_type_id: 'node',
    bundle: 'article',
    uuid: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
  },
  // plus type/component information for non-entity routes,
  // and a redirect when Drupal says the path moved.
}
```

That answer determines everything else: the entity's resource type and UUID
become a [store](/explanation/druxt-store) request for the `druxt-entity`
component to render, and the route's language context travels with it.

## Beyond entities: path translators

Not every path maps to an entity. Drupal-side **path translator**
subscribers extend translation to other route types: the `druxt` Drupal
module provides translators for **Views** pages (`jsonapi_views`), the
**contact** form, and **wildcard** fallbacks, so the frontend can render
views pages and forms the same way it renders nodes.

## Where routing happens

The `druxt-router` package provides:

- **A Vuex store** (`druxtRouter`): the `get` action performs translation
  and caches results per path; `route`, `routes`, `entities` and
  `redirects` state keep the history.
- **A `DruxtRouter` component**: renders the route's entity once resolved.
- **Nuxt middleware**: translates the current path on server-side
  navigation and **processes redirects** (a 301 from Drupal becomes a
  frontend redirect, so URL changes on the backend propagate automatically).
  The middleware can be disabled (`druxt.router.middleware: false`) when a
  site needs fully static builds without a live backend.

## Multilingual paths

Drupal serves translated content under language prefixes (`/es/...`), and
JSON:API exposes the same prefixes. The router and the store share the
`prefix` concept, so a translated path resolves to the translated resource
in one flow, with the caveat that translated route resolution currently
needs a `decoupled_router` patch, tracked in the
[multilingual guide](/how-to/multilingual).

## Why translation instead of frontend route definitions?

The alternative (duplicating Drupal's URL aliases, redirects and language
rules as frontend route config) drifts the moment anything changes in
Drupal. Translation keeps Drupal authoritative for _what serves
a path_, and the frontend authoritative for _how it renders_. The cost is a
backend round trip per unresolved path, which the route cache and SSR
mitigate.

## Where to go next

- [The schema system](/explanation/schemas): what happens after the route
  resolves.
- [DruxtRouter API reference](/api/packages/router).
