---
'druxt': minor
'druxt-blocks': minor
'druxt-breadcrumb': minor
'druxt-menu': minor
'druxt-router': minor
'druxt-schema': minor
'druxt-site': minor
'druxt-views': minor
---

Vue and Vuex are now peer dependencies, so the packages use the site's own copy. A second copy stopped Nuxt at startup with a version mismatch.
