---
'druxt-router': patch
---

fix(#963): `DruxtRouter` no longer throws `Cannot read properties of undefined (reading 'error')` when it renders before its route arrives.

Until the route arrives, it renders without the default error slot.
