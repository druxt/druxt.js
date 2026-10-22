---
'druxt': patch
---

fix(#881): `druxt/flushCollection` and `druxt/flushResource` now delete the data they name. Some payloads removed nothing at all.

- Pass a `prefix` with a `type` to flush that prefix for every stored query of the type.
- Pass the collection's `query` in place of its `hash`. Druxt hashes it the way `getCollection` does.
- Flushing a type that holds nothing is a no-op, where it used to throw.

```js
// Every stored node--article query in the `en` prefix.
this.$store.commit('druxt/flushCollection', { type: 'node--article', prefix: 'en' });
// One collection, named by the query that fetched it.
this.$store.commit('druxt/flushCollection', { type: 'node--article', query });
```

`druxt/getResource` with `bypassCache` now fetches every requested field and returns the included resources from the fresh response. Reading a flushed resource with `include` used to throw.
