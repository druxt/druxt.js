---
'druxt-router': patch
---

A route lookup that fails without a 4xx from Drupal, such as a network error, is no longer stored, so the next visit to that path asks again.
