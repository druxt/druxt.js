---
'druxt-views': minor
---

feat(#1019): a view fetches its results again after `druxt/clearCache` or another flush of its results empties them, so signing out shows the results an anonymous visitor gets. It keeps showing its rows while it fetches.
