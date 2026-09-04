---
title: The DruxtStore
weight: -8
description: The DruxtStore caches Drupal collections and resources as shared references, so two components asking for the same article hit Drupal once.
---

The `DruxtStore` is a Vuex module that acts as Druxt's shared data layer:
every module (entity, menu, views, router) reads from and writes to it. It
sits between the components and the
[`DruxtClient`](/how-to/use-the-druxt-client), and its job is to make sure
Drupal is asked as little as possible.

This page explains the store's shape, its caching rules, and the
collections/resources model that makes cross-module data sharing work.

## Two maps, not one

The state is two plain objects, keyed differently on purpose:

```js
state: () => ({
  collections: {}, // collections[type][hash][prefix]
  resources: {}, // resources[type][id][prefix]
});
```

- **`resources`** is keyed by identity: resource `type` and `id`. A resource
  has exactly one home here, no matter how many different queries returned
  it.
- **`collections`** is keyed by query: the resource `type`, a `hash` derived
  from the query, and the language `prefix`.

The `prefix` key is the JSON:API language prefix (such as `es`), so
translated variants of the same resource coexist rather than overwrite each
other.

## Dehydration: collections store references

When a collection arrives from Drupal, `addCollection` does something that
surprises people the first time: it strips the resource data out of the
collection. Each item is committed individually to `resources`, and the
collection's `data` array is left holding only `{ id, type }` references.

If an article appears in both a listing and a fetch of the same article by
UUID, its attributes and relationships are stored **once**. That's the
payoff.
Included resources (`?include=...`) go through the same path: a query that
brings in an article's image also populates `resources` for the image and
its file, ready for whichever component needs them next.

Rehydrating reverses the trick: `getCollection` reads the references back
out of the collection and joins them against `resources` before returning.

## Caching rules

### Collections: the query hash

`getCollection` hashes the query (everything except `fields` and `include`)
with MD5 to form the cache key. Calls with the same filter, sort and
pagination share an entry. Adding `bypassCache: true` skips the check and
re-requests.

### Resources: full and partial flags

Resources are cached with a **completeness flag**. When a `fields[...]`
filter narrowed the query, the stored resource is marked `_druxt_partial`
with a timestamp; a full fetch is marked `_druxt_full`. This distinction
lets `getResource` serve a cached partial when only those fields are needed,
while recognizing that a complete render needs more.

### Includes are recursive

`getResource` hydrates `?include=` relationships by dispatching `getResource`
for each related resource, including nested includes
(`include=media,media.image`). Missing pieces are fetched; present ones are
reused.

## Using the store

Components rarely talk to the client directly; they dispatch actions:

```js
// One article, by type and UUID.
const resource = await this.$store.dispatch('druxt/getResource', {
  type: 'node--article',
  id: 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
});

// All articles matching a query.
const collection = await this.$store.dispatch('druxt/getCollection', {
  type: 'node--article',
  query: new DrupalJsonApiParams().addFilter('status', '1'),
});
```

Both accept a `prefix` (language) and `bypassCache`. Mutations exist for the
other direction (`addResource`, `addCollection`, `flushResource`,
`flushCollection`) and are what custom cache-invalidation usually wants.
The [mutation and action reference](/api/packages/druxt/stores/druxt) lists
every signature; retired signatures are tracked on the
[deprecations page](/modules/druxt/deprecations).

## The case for a store

A Nuxt component _could_ fetch JSON:API directly. Using a store instead pays
off three ways:

1. **Request deduplication** across components and modules: one Drupal hit
   per unique resource, per render pass.
2. **A stable identity** for data whose _representation_ varies by query:
   the references model keeps partial and full views coherent.
3. **A seam for SSR**: cached state serializes with the page, so hydration
   doesn't refetch everything in the browser.

## Where to go next

- [Decoupled routing](/explanation/routing): how paths become the resource
  requests the store serves.
- [Use the Druxt client directly](/how-to/use-the-druxt-client): the layer
  underneath, without Vuex.
