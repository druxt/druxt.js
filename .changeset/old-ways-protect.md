---
'druxt-router': patch
---

Route errors such as 403 and 404 are now returned by the `druxtRouter/get` action and rendered by the Router middleware via the Nuxt `error()` function. The Nuxt plugin also reuses the `app.$druxt` client when available instead of creating a second DruxtClient.
