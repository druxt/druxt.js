---
'druxt': minor
---

feat(#885): clear every Druxt cache with `druxt/clearCache`, or let Drupal clear it when content changes: set `druxt.cache.secret` and send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#clearing-from-drupal-with-purge) shows the Drupal Purge setup.

```js
// nuxt.config.js
export default {
  druxt: {
    cache: { secret: process.env.DRUXT_CACHE_SECRET },
  },
};
```

```sh
curl -X POST -H "X-Druxt-Secret: $DRUXT_CACHE_SECRET" https://example.com/_druxt/cache/clear
```
