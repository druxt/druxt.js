---
'druxt': patch
---

fix(#961): the server cache keeps a response Drupal varies by `Origin`, so it works on a site with Drupal's CORS on. It kept nothing there, the JSON:API index included.

Drupal's CORS adds `Vary: Origin` to every response, and the site's server never sends an `Origin` header, so every answer it gets is the one for no origin. A client that sends its own `Origin` header, such as one set with `addHeaders()`, doesn't use the cache, as one that sends credentials doesn't.
