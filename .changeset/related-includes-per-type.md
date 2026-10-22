---
'druxt': patch
---

fix(#953): revisiting a page no longer fetches its paragraphs again with an include their type doesn't have, which Drupal refused with a 400 and turned Nuxt's loading bar red. An include given only as a nested path, such as `field_content.field_media`, now also counts `field_content` as included, as JSON:API does.
