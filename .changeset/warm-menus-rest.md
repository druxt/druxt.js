---
'druxt-menu': patch
---

The menu store no longer fetches a menu it already holds. A repeat `druxtMenu/get` with the same menu name, settings and prefix makes no backend request, and identical calls made at the same time share one request. A different name, settings or prefix still fetches, and `druxtMenu/flushEntities` makes the next call fetch again.
