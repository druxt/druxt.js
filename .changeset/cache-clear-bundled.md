---
'druxt': patch
---

fix(#950): the cache clear handler is bundled with the Nuxt module, so `druxt/server-middleware/` exports only `template.mjs`.
