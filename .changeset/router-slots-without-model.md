---
'druxt-router': patch
---

`DruxtRouter` no longer throws during render when it has no route yet.

A router whose fetch had not set a route rendered nothing and threw `Cannot read properties of undefined (reading 'error')`. It now renders without the default error slot until a route arrives.
