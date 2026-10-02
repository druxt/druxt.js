---
'druxt-menu': patch
---

The menu store no longer fetches a menu it already holds. A repeat `druxtMenu/get` with the same menu name, settings and prefix does not reach the backend, and identical concurrent calls share one request. A different name, settings or prefix still fetches, and `druxtMenu/flushEntities` makes the next call fetch again.

Flushing reaches the menus being fetched as well as the ones already held. Where a request was still in flight, its menu is neither stored nor marked as loaded, and the next call fetches instead of waiting on a result that is already being discarded. Naming a prefix restricts all of this to that prefix, leaving requests for the others alone.
