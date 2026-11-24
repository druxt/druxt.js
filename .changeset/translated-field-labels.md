---
'druxt-schema': minor
'druxt-entity': patch
---

feat(#1056): field labels and descriptions now show in the entity's language. A Spanish recipe on Umami shows `Tiempo de preparación` above its preparation time, where it showed `Preparation time`.

At build, Druxt reads the field labels each language translates, through that language's URL prefix, and writes them beside the schemas. `DruxtEntity` applies them for its `langcode`. With `schema.refresh` on, the labels are read again after each cache clear, as the schemas are.

A wrapper that calls `druxtSchema/get` itself can pass a `langcode` to get the schema with that language's labels.
