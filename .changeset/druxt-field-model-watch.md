---
'druxt-entity': patch
---

fix(#1037): loading `druxt-entity` no longer stops other Druxt modules from passing their value to their parent. An exposed Views filter with the default auto apply now filters the results on a site that uses `druxt-entity`, and a parent that binds a module with `v-model` hears its changes.
