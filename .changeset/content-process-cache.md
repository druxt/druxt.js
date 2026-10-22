---
'druxt': minor
---

feat(#639): set `cache.content: true` to keep entities, collections, views and route lookups in the server cache too, so a page's second anonymous visitor costs Drupal nothing until its `Cache-Control` lifetime runs out. Pair it with a clear from Drupal, such as Purge calling `/_druxt/cache/clear`, so edits show straight away. The cache now keeps at most `cache.max` responses per area, 1000 by default.

```js
// nuxt.config.js
export default {
  druxt: {
    cache: { content: true, secret: process.env.DRUXT_CACHE_SECRET },
  },
};
```
