---
'druxt-menu': patch
---

In the browser, a menu request is now shared only while it is in flight, so a menu fetched before a login is fetched again after it instead of showing the signed-out menu.
