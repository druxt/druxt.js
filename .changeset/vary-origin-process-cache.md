---
'druxt': patch
---

fix(#961): the server cache keeps Drupal's responses on a site whose CORS sends `Vary: Origin`. Before, it kept none of them, not even the JSON:API index.

Drupal's CORS adds `Vary: Origin` to every response when it allows more than one origin. The Nuxt server sends no `Origin` header, so its requests all get the same answer and can share one cached copy. A request that sets its own `Origin` header, such as with `addHeaders()`, or that sends credentials, still skips the cache. `druxt.cache: false` turns the cache off.
