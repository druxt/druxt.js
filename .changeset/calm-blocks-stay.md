---
'druxt': patch
'druxt-blocks': patch
'druxt-breadcrumb': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-router': patch
'druxt-site': patch
'druxt-views': patch
---

Druxt components no longer flicker on the first load of a production build. Each module now registers its components as synchronous imports, so a server-rendered block or field is kept after hydration and does not fetch its data a second time. Sites that added a `components:extend` hook to work around this can remove it.
