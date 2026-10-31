---
'druxt': patch
---

fix(#964): the Nuxt module adds `@nuxtjs/proxy`, and its proxy table, only when the `api` or the `files` proxy is on. A `proxy` setting with both off, such as `proxy: { api: false }`, added it anyway.
