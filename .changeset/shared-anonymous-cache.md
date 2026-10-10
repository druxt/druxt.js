---
'druxt': minor
---

In production, the server keeps the JSON:API index and menus between requests for as long as Drupal's `Cache-Control` allows, so set a page cache max-age in Drupal to use it. Signed-in responses are never kept. Set `druxt.cache: false` to turn it off. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#server-cache) covers `ttl`, `sessionCookie` and which responses are kept.
