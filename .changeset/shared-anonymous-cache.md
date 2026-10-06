---
'druxt': minor
---

In production, the server keeps the JSON:API index and menus between requests for as long as Drupal's `Cache-Control` allows, so set a page cache max-age in Drupal to use it. Signed-in requests never read or fill it. Set `druxt.cache: false` to turn it off. The druxt README covers `ttl`, `sessionCookie` and which responses are kept.
