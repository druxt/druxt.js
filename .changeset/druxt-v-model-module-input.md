---
'druxt': patch
---

fix(#1005): `v-model` on the `Druxt` component follows the module component. Before, it never saw a change the module made to its value.

`<Druxt v-model="entity" module="entity-form" :props-data="{ type: 'node--page', uuid }" />` now updates `entity` each time the form edits a field.

A module component with the default wrapper no longer emits `input` for a value its parent set, nor a second time for an input its wrapper emitted. A listener on `@input` sees each change once.
