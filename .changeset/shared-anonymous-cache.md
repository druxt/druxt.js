---
'druxt': minor
'druxt-menu': patch
---

The JSON:API index and menus are now cached on the server between requests, for five minutes, in production. Only requests that do not send an Authorization header, basic auth or a Drupal session cookie read or fill the cache, so a logged-in user never gets, or leaves behind, a response built for someone else. Set `druxt.cache.ttl` to change the lifetime, `druxt.cache.sessionCookie` to name a custom session cookie, or `druxt.cache: false` to turn it off. It is off under `nuxt dev` and for a `DruxtClient` created without the `cache` option.
