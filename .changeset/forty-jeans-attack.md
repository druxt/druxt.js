---
"druxt-breadcrumb": minor
"druxt-blocks": minor
"druxt-entity": minor
"druxt-router": minor
"druxt-schema": minor
"druxt": minor
"druxt-views": minor
"druxt-menu": minor
"druxt-site": minor
---

feat(#693): update Nuxt modules to use @nuxt/kit.

  ⚠ Breaking changes

  Node version >=18 is required to use `@nuxt/kit`.

  Nuxt module location has changed to 'druxt(-[MODULE])/nuxt' and must be updated
  in your `nuxt.config.js`.

  e.g.
  ```diff
  -  modules: ['druxt-site'],
  +  modules: ['druxt-site/nuxt'],
  ```
