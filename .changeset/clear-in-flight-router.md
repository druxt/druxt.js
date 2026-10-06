---
'druxt-router': patch
---

A route fetched across a flush is no longer stored, but the page still renders it, so the title, breadcrumb and block regions follow the page shown. `druxtRouter/setRoute` also takes `{ path, route }`.
