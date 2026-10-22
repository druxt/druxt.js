---
'druxt': minor
---

feat(#885): clear every Druxt cache with `druxt/clearCache`, or let Drupal clear it when content changes: set `druxt.cache.secret` and send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The clear empties the JSON:API index and the server cache, and flushes stored resources, view results, menus, routes and schemas (#903). A request in flight when it happens stores nothing it fetched. The [druxt README](https://github.com/druxt/druxt.js/tree/HEAD/packages/druxt#clearing-from-drupal-with-purge) shows the Drupal Purge setup.

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
