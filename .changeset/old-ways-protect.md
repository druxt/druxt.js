---
'druxt-router': patch
---

Route errors such as 403 and 404 render through Nuxt's `error()`, and the plugin reuses the site's `$druxt` client instead of creating a second one.
