---
'druxt': minor
---

fix(#872)!: wrapper components no longer render module data as HTML attributes, such as `entity="[object Object]"`. Wrappers still read it from `$attrs`. An `id` set on a module no longer repeats on the modules below it.

```diff
- <article entity="[object Object]" schema="[object Object]" id="node-1">
+ <article id="node-1">
```
