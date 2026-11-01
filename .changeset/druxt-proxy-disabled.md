---
'druxt': patch
---

fix(#964): the Nuxt module loads `@nuxtjs/proxy` only when the `api` or `files` proxy is on.

With both off, as with `proxy: { api: false }`, it loaded `@nuxtjs/proxy` with nothing to proxy, so the package had to be installed. A site that relied on that for its own `proxy` entries now adds `@nuxtjs/proxy` to its `modules`.
