---
'druxt': minor
---

Wrapper components no longer render the module data they receive as HTML attributes, so an entity renders `<div>` where it rendered `<div entity="[object Object]" fields="[object Object]">`. Wrappers still read that data from `$attrs`.

An `id` set on a module no longer repeats on the modules below it.
