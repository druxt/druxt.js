---
'druxt': patch
---

fix(#1005): `v-model` on the `Druxt` component updates when the module changes its value. Before, it never saw those changes.

`<Druxt v-model="entity" module="entity-form" :props-data="{ type: 'node--page', uuid }" />` now updates `entity` each time the form edits a field.

A module no longer sends back a value its parent set, so a parent using `v-model` sees each change once.
