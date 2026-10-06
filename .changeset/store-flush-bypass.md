---
'druxt': patch
---

`druxt/flushCollection` and `druxt/flushResource` now delete the data they name. Some payloads removed nothing at all.

- Pass a `prefix` with a `type` to flush that prefix for every stored query of the type.
- Pass the collection's `query` in place of its `hash`. Druxt hashes it the way `getCollection` does.
- Flushing a type that holds nothing is a no-op, where it used to throw.

`druxt/getResource` with `bypassCache` now fetches every requested field and returns the included resources from the fresh response. Reading a flushed resource with `include` used to throw.
