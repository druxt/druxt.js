---
'druxt-menu': patch
---

perf(#843): requests for one menu that build the same query share a fetch, and the plugin reuses the site's `$druxt` client when it has one.
