---
'druxt-menu': patch
---

A menu no longer renders empty when the cache is cleared while it loads. `druxtMenu/get` fetches it again, and returns the menu items it stored.
