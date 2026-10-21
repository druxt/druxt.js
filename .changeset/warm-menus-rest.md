---
'druxt-menu': patch
---

fix(#838): a menu the store already holds is no longer fetched again, so a menu mounted in the browser renders without a request. Clearing the cache, or a login or logout in the browser, makes the next call fetch.
