---
'druxt-site': patch
'druxt-router': minor
---

`druxt-router` is now registered like every other Druxt module:

```js
// nuxt.config.js
modules: ['druxt-router']
```

`'druxt-router/nuxt'` still works. Neither `druxt-router` nor `druxt-site` pulls Node's `fs` into client bundles any more, so `DruxtSiteMixin` can be imported client side (#545).
