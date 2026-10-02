---
'druxt-site': patch
'druxt-router': minor
---

`druxt-router` is now registered like every other Druxt module:

```js
// nuxt.config.js
modules: ['druxt-router']
```

`'druxt-router/nuxt'` still works. The module was split out under that name because it read the filesystem to look for a `pages/` directory, which pulled Node's `fs` into client bundles. Both it and `druxt-site` now load `fs` through the Nuxt resolver, so importing either package in the browser no longer breaks the build, and `DruxtSiteMixin` can be imported client side (#545).
