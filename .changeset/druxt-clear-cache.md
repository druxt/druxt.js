---
'druxt': minor
---

Clear every Druxt cache with `druxt/clearCache`, or let Drupal clear it when content changes: set `druxt.cache.secret` and send `POST /_druxt/cache/clear` with the secret in an `X-Druxt-Secret` header. The [druxt README](README.md#clearing-from-drupal-with-purge) shows the Drupal Purge setup.
