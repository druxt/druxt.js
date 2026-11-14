---
'druxt-schema': patch
---

fix(#1022): the schema build no longer stops on a Drupal site whose JSON:API answers an error past the first page of the display collections, as every site with Drupal Canvas 1.12.0 installed does.

When a later page fails, the displays are read again filtered by entity type, and by bundle where one entity type has more than one page of them, so no request needs a page offset. Sites that added a Composer patch to Canvas for `nuxt build` to pass can keep it or drop it.
