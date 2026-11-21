---
'druxt-schema': patch
---

fix(#1022): the schema build no longer stops when Drupal's JSON:API fails on a later page of the entity view or form displays, as it does on every site with Drupal Canvas 1.12.0 installed.

Druxt reads those displays again in smaller requests, filtered by entity type and bundle. A Composer patch to Canvas added for `nuxt build` to pass can stay or go. A bundle with more than 50 view or form displays of its own still stops the build on such a site.
