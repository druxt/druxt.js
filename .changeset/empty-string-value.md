---
'druxt': patch
'druxt-entity': patch
'druxt-views': patch
---

fix(#1037): an empty string passed as the `value` of a module, a field or an exposed Views filter stays an empty string. Before, Vue read it as `true`.

A custom field component that emits `''` now passes `''` to its parent, where it used to arrive as `undefined`. Code that checks for `undefined` to spot a cleared field should check for `''` too. Druxt's built-in text input still sends `undefined`.
