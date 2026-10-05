---
'druxt-menu': patch
---

A menu still renders when its cache is cleared while it loads. The store drops a menu fetched before a flush, and the component built its menu from the store, so it rendered empty until the next fetch. The `druxtMenu/get` action now returns the fetched menu items, and `DruxtMenu` builds from them when the store holds none.
