---
'druxt': patch
---

fix(#943): `druxt` depends on consola ^2.15.3, where a `*` peer let a fresh install pick consola 3 and break the Nuxt 2 build. Sites that pinned `consola: 2.15.3` can drop the pin.
