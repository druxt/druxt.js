---
'druxt-schema': minor
---

Schemas can follow display changes in Drupal without a rebuild. Set `druxt.schema.refresh`, and the Nuxt server regenerates them after each cache clear. The [druxt-schema README](README.md#refresh-schemas-without-a-rebuild) covers it, including `createSchemaRefresh` for a static site's own Node server.
