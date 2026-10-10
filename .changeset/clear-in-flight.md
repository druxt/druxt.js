---
'druxt': patch
---

A request in flight when the cache is cleared no longer stores what it fetched, so a clear can't leave old content in place. This covers the JSON:API index and the store.
