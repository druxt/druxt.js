---
'druxt-menu': patch
---

Menu results are now cached per client and process, concurrent requests for one menu share a fetch, and the Nuxt plugin reuses the `app.$druxt` client when available instead of creating a second DruxtClient.
