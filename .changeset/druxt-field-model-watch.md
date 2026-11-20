---
'druxt-entity': patch
---

fix(#1037): loading `druxt-entity` no longer stops other Druxt modules from updating their `v-model`. An exposed Views filter with the default auto apply now filters the results on a site that uses `druxt-entity`.

A parent of a Druxt module now receives its `input` events on these sites. A site that worked around the missing events should remove the workaround, since a value may otherwise be handled twice.
