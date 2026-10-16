---
'druxt': patch
'druxt-router': patch
---

`druxt` depends on consola ^2.15.3 directly, where it declared a `*` peer. The `*` peer let a fresh install pick consola 3, and the Nuxt 2 build cannot parse it. Sites that pinned `consola: 2.15.3` to work around it can drop the pin. Axios stays a peer.

`druxt-router` depends on `drupal-jsonapi-params` ^2.3.2, where it declared a `*` peer.
