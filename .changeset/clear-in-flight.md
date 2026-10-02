---
'druxt': patch
'druxt-menu': patch
'druxt-router': patch
'druxt-views': patch
---

A request that was already in flight when the cache was cleared no longer stores what it fetched before the clear. Clearing the cache because content changed in Drupal could leave the old content served for the rest of its lifetime.

The same holds for the client's JSON:API index and the store: an index or store request in flight during a clear is not kept, and a call made after the clear fetches afresh instead of joining it. The router, Views and menu stores drop a route, result or menu fetched before a flush in the same way.

A route dropped that way is still the route being rendered, so it is now the active route even though the cache does not hold it. The page title, breadcrumb and block regions follow the page in front of the visitor instead of the one before it. `druxtRouter/setRoute` takes `{ path, route }` as well as a path, and a route the cache never stored, such as one behind a `500`, is now the active route where it used to leave the previous route in place.
