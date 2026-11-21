---
'druxt': patch
'druxt-entity': patch
'druxt-views': patch
---

fix(#1037): an empty string passed as the `value` of a module, a field or an exposed Views filter stays an empty string. Before, Vue read it as `true`.

A field component of a site's own that emits `''` when emptied now sends its parent `''`. Before, the parent got `undefined`, so code that checks for `undefined` to spot a cleared field should check for `''` too. Druxt's built-in text input still sends `undefined`.
