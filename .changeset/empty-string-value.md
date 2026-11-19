---
'druxt': patch
'druxt-entity': patch
'druxt-views': patch
---

fix(#1037): an empty string passed as the `value` of a module, a field or a Views filter stays an empty string. Vue read it as `true` before.

An emptied field now reaches its parent as an empty string rather than `undefined`.
