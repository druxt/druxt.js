---
'druxt': minor
---

Wrapper components no longer render module data as HTML attributes, such as `entity="[object Object]"`. Wrappers still read it from `$attrs`. An `id` set on a module no longer repeats on the modules below it.
