---
'druxt': patch
---

fix(#658): an ESM axios hoisted into the site no longer breaks the dev server, because the Nuxt module adds axios to `build.transpile`. The axios peer range is `>=0.28.0`.
