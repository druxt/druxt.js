---
'druxt': patch
---

Fix the Nuxt module adding `@nuxtjs/proxy` when `proxy` is set with neither `api` nor `files` enabled, such as `proxy: { api: false }`.

The proxy module, and its proxy table, are now added only when one of them is on.
