---
title: Deprecations
weight: 10
description: Retired DruxtRouter client and store members, with their replacements.
---

# Deprecations

## DruxtRouter pass-through methods

> [druxt-router] Use the DruxtClient directly.

**Version:** `>= 0.18.0`

The `DruxtRouter` class historically mirrored a set of `DruxtClient`
methods as pass-through methods on its `router.druxt` instance. These are
deprecated in favour of using a `DruxtClient` (or the
[`DruxtStore`](/explanation/druxt-store) in Nuxt) directly:

| Deprecated                                            | Replacement                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `router.druxt.addHeaders(headers)`                    | Set headers via the `DruxtClient` axios options, or `client.axios` interceptors. |
| `router.druxt.buildQueryUrl(url, query)`              | `client.buildQueryUrl(url, query)`                                               |
| `router.druxt.checkPermissions(res)`                  | Handle JSON:API `meta.omitted` links client-side.                                |
| `router.druxt.getIndex(resource)`                     | `client.getIndex(resource)`                                                      |
| `router.druxt.getResource(type, id)`                  | `client.getResource(type, id)`                                                   |
| `router.druxt.getResources(resource, query, options)` | `client.getResources(resource, query, options)`                                  |

The routing methods themselves (`getRoute`, `getResourceByRoute`,
`getRedirect`) are not deprecated; only the generic client
pass-through methods are.

## DruxtRouter store resource members

> [druxt-router] Use the DruxtStore instead.

**Deprecated in:** `druxt-router:0.18.0`
**Removed in:** `druxt-router:1.0.0`

The same release deprecated the `druxtRouter` store's generic resource
members. Routing state (`route`, `routes`, `redirects`) stays in
`druxtRouter`; resources belong in the
[DruxtStore](/explanation/druxt-store), which caches and de-duplicates them
for every module:

| Deprecated                          | Replacement                  |
| ----------------------------------- | ---------------------------- |
| `druxtRouter/addEntity` (mutation)  | `druxt/addResource` mutation |
| `druxtRouter/getEntity` (action)    | `druxt/getResource` action   |
| `druxtRouter/getResources` (action) | `druxt/getCollection` action |

```js
// Deprecated.
await this.$store.dispatch('druxtRouter/getEntity', query);

// Use the DruxtStore.
await this.$store.dispatch('druxt/getResource', { type, id });
```
