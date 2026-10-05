---
'druxt-menu': patch
---

A menu still renders when its cache is cleared while it loads. The store drops a menu fetched before a flush, so the component rendered an empty menu until the next fetch. The `druxtMenu/get` action now fetches the menu again when the store is flushed during its request, and returns the menu items it stored.
