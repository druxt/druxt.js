---
'druxt': minor
---

perf(#848): in production, the server keeps Drupal's responses between requests for as long as Drupal's `Cache-Control` allows, so set a page cache max-age in Drupal to use it. It keeps the JSON:API index and menus, and with `cache.content: true` (#639) it keeps entities, collections, views and route lookups too, so a page's second anonymous visitor costs Drupal nothing. Pair `cache.content` with a clear from Drupal so edits show straight away. Signed-in responses are never kept. Each cache area holds at most `cache.maxSize` of stored JSON, 50 MB by default, and drops the least recently used first. Set `druxt.cache: false` to turn it off. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#server-cache) covers `ttl`, `sessionCookie`, `maxSize` and which responses are kept.

```js
// nuxt.config.js
export default {
  druxt: {
    cache: { content: true, ttl: 300 }, // or `cache: false`
  },
};
```
