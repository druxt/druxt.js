---
'druxt-views': minor
---

feat(#1019): a view fetches its results again after `druxt/clearCache` or any flush of the results it shows, so signing out shows the results an anonymous visitor gets. It keeps showing its rows while it fetches.

Flushing one language or one query with `druxt/views/flushResults` now removes those results from the store. Before, a flushed query was answered from the store with empty results.
