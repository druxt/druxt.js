---
'druxt': patch
'druxt-router': patch
---

`druxt` depends on axios 0.33.0 and consola ^2.15.3 directly instead of as `0.28.0` and `*` peers. The `*` peer let a fresh install pick consola 3, which the Nuxt 2 build cannot parse. Sites that pinned `consola: 2.15.3` to work around it can drop the pin.

`druxt-router` depends on `drupal-jsonapi-params` ^2.3.2 instead of a `*` peer.
