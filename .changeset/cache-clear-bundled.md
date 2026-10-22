---
'druxt': patch
---

fix(#950): every file `druxt/server-middleware/*` exports loads on its own. The cache clear handler is part of the Nuxt module's bundle, so `template.mjs` is the one file in that directory.
