---
'druxt-schema': patch
---

fix(#1022): the schema build no longer stops when Drupal's JSON:API returns an error for a later page of the entity view or form displays, as it does on every site with Drupal Canvas 1.12.0 installed.

When a later page fails, the displays are read again filtered by entity type, and by bundle where one entity type has more than one page of them, so no request needs a page offset. A bundle with more than one page of displays of its own still stops the build on such a site. Sites that added a Composer patch to Canvas for `nuxt build` to pass can keep it or drop it.
