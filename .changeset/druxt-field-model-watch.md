---
'druxt-entity': patch
---

fix(#1037): loading `druxt-entity` no longer stops other Druxt modules from updating their `v-model`, so an exposed Views filter with the default auto apply filters the results on these sites.

Remove any workaround for the missing `input` events, or a value may be handled twice. A custom wrapper still emits `input` itself, as before.
