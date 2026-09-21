---
'druxt': patch
'druxt-blocks': patch
'druxt-breadcrumb': patch
'druxt-menu': patch
'druxt-router': patch
'druxt-schema': patch
'druxt-site': patch
'druxt-views': patch
---

Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch.
