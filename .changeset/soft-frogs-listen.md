---
'druxt-menu': patch
---

Menu results are now cached per client and process, requests for one menu that build the same query share a fetch, and the Nuxt plugin reuses the `app.$druxt` client when available instead of creating a second DruxtClient.
