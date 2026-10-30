---
'druxt': patch
---

The process cache keeps a response Drupal varies by `Origin`. Drupal's CORS adds `Vary: Origin` to every response while it is on, which decoupled sites have, so the cache kept nothing on them, the JSON:API index included. The site's server never sends an `Origin` header, so every answer it gets is the one for no origin, and `Origin` tells no variants apart, as `Cookie` does not.

The process cache isn't used for a client that sends its own `Origin` header, such as one set with `addHeaders()`. That matches how it treats a client sending credentials.
