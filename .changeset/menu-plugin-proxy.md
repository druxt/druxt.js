---
'druxt-menu': patch
---

The druxt-menu plugin keeps `proxy.api` on in the browser, so a menu client built without the shared druxt client sends its requests through the Nuxt proxy, as the router does.
