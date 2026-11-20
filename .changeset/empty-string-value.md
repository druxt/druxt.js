---
'druxt': patch
'druxt-entity': patch
'druxt-views': patch
---

fix(#1037): an empty string passed as the `value` of a module, a field or an exposed Views filter stays an empty string. Before, Vue read it as `true`.

A field that is emptied now sends its parent an empty string. Before, it sent `undefined`, so code that checks for `undefined` to spot a cleared field should check for `''` too.
