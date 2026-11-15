---
'@druxt/core': major
---

feat(#980)!: add `@druxt/core`, the Druxt module for Nuxt 4, in place of the `druxt` package.

The store runs on Pinia, and `useDruxtClient()` gives a component the configured client. `useDruxtStore()` is auto-imported, and its `peekResource()` and `peekResources()` read what the store holds, with no request, during a render.

The store's `getResource()` throws a `TypeError` naming an empty type or id. 1.x returned an empty object. Server renders for one browser that need a refresh at once, such as tabs opening together after Drupal revoked the visitor's access token, share one refresh within the server process, as Simple OAuth accepts a refresh token once.

The module splits `druxt` once. Secrets move to the private `runtimeConfig.druxt`, and the rest is public at `runtimeConfig.public.druxt`.

Under pnpm, `nuxt dev` works without adding the module's CommonJS libraries to your own dependencies.

BREAKING CHANGE: install `@druxt/core` in place of `druxt`. The module runs on Nuxt 4 and Vue 3 only, the store is Pinia, and the options-API `DruxtModule` and the mixins are gone from core. The private runtime config keys `druxtAuth`, `druxtCache` and `druxtBuild` are now `druxt.auth`, `druxt.cache` and `druxt.build`, and the environment variable names are unchanged.

`getResource()` waits for a request already in flight for the same resource with another query, unless the store already answers, so a second reader of one entity, such as a standalone field beside its entity, is answered from the store. A request with the same query is shared, its failure included.

The store's `addResource()` and `addCollection()` take `partial`, so a module seeding a view's rows records the fields each holds, and a later read of another field fetches it. A resource with no self link is still stored. An included resource, at any depth, is stored with every field, so a sparse read of it comes from the store. The store doesn't keep Drupal's `links` on resources, relationships or collections, so a page's payload doesn't name backend URLs. What Drupal omitted is kept as its reason and the omitted types and ids.

The store's `peekMeta()` gives the `meta` of the document a resource came in, such as what Drupal omitted, with no request. A stored resource's includes skip the resources Drupal already denied, and omitted links are read against the client's JSON:API path.
