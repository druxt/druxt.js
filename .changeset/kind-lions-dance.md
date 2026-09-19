---
'druxt-schema': patch
---

Schema resource collections are now cached per client and process, keyed by resource type and query, and concurrent requests for one collection share a fetch.
