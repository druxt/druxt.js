---
'druxt-schema': minor
'druxt': patch
---

Schemas can follow display changes in Drupal without a rebuild. With `druxt.schema.refresh`, the Nuxt server regenerates a schema the first time a page needs it and holds it until the next cache clear. The browser fetches it from the server at `/_druxt/schema/<id>`, and the schema from the build is used whenever regeneration fails. Under `nuxt dev` each request regenerates, as there is no cache to clear. A static site keeps the schemas from its build.

`druxt/clearCache` now also flushes the stored schemas.
