---
'druxt': minor
'druxt-menu': patch
'druxt-router': minor
---

Clear every Druxt cache with `this.$store.dispatch('druxt/clearCache')`, or clear the client's caches with `this.$druxt.clearCache()`. The new `druxtRouter/flushRoutes` mutation removes one stored route, or all of them.

Drupal can empty the server cache when content changes. Set a secret:

```js
// nuxt.config.js
export default {
  druxt: {
    cache: { secret: process.env.DRUXT_CACHE_SECRET },
  },
};
```

Then send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The secret stays on the server. Each Nuxt process has a separate cache, so a site with several processes needs each one cleared.
