---
'druxt': patch
---

fix(#1005): `v-model` on the `Druxt` component follows the module component. Before, it never saw a change the module made to its value.

`<Druxt v-model="value" module="entity" />` now updates `value` when the module emits `input`, as when an entity form edits a field.
