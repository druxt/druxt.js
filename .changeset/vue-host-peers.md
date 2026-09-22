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

Vue and Vuex are now peer dependencies, so the packages use the site's own copy instead of installing one beside it. A second Vue that differs from the site's `vue-server-renderer` stops Nuxt at startup with a version mismatch.
