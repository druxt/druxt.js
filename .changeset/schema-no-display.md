---
'druxt-schema': patch
---

fix(#836): `getSchema()` resolves `false` when the bundle has no display for the requested mode, as it does for an invalid configuration, instead of a schema with no `schema` data.

Code that checks the result of `getSchema()` no longer needs to test `.schema` as well.
