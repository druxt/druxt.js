---
'druxt-schema': patch
---

fix(#836): `this.$druxtSchema.getSchema()` resolves `false` when the bundle has no view or form display for the requested mode, as it does for an invalid configuration.

It resolved a schema object whose `schema` property was `undefined`. Check the result for `false` before reading from it. The `druxtSchema/get` store action, and the mixin's `getSchema()` that maps to it, are unchanged.
