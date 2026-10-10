---
'druxt': patch
---

fix(#658): an ESM axios hoisted into the site no longer breaks the dev server, because the Nuxt module adds axios to `build.transpile`. Sites need axios 0.34.0 or later.
