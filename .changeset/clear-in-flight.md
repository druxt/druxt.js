---
'druxt': patch
---

fix(#885): a request in flight when the store is flushed no longer stores what it fetched, so a flush can't leave old content in place.
