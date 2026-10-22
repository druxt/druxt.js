---
'druxt-views': patch
---

fix(#639): a `bypassCache` view query now also skips the server's process cache, so a refreshed view always comes from Drupal.
