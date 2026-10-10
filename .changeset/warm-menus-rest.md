---
'druxt-menu': patch
---

The menu store no longer fetches a menu it already holds. A repeat `druxtMenu/get` with the same menu name, settings and prefix does not reach the backend and returns the stored items, and identical concurrent calls share one request. A different name, settings or prefix still fetches, and `druxtMenu/flushEntities` makes the next call fetch again.

A flush also reaches the menus being fetched for its prefix. A request still in flight fetches again before it stores anything, and calls made in the meantime wait for that fresh menu. Naming a prefix restricts this to that prefix, leaving requests for the others alone.

Menus that ask for different fields share their stored items, and each item keeps the fields every menu fetched, so an answer from the store has the fields its menu asked for.

In the browser, a login or logout clears the stored menus, so the next menu shows the links for the new user.
