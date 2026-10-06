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

Druxt components no longer flicker or fetch their data again on the first load of a production build. Remove any `components:extend` hook added to work around it.
