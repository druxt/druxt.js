---
'druxt': patch
---

fix(#953): revisiting a page no longer fetches related resources, such as paragraphs, again with an include their type doesn't have, which Drupal refused with a 400 and turned Nuxt's loading bar red. A nested include such as `field_content.field_media` also includes `field_content`, as JSON:API does.
