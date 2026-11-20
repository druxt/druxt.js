---
'druxt': patch
---

fix(#1013): when a request fails, the document `druxt/getResource` returns has an `error` property, `{ statusCode, message }`, so a caller can tell a 401 from a missing resource. A request that never reached Drupal reports 500. Before, nothing in the document said the request had failed.

An include that Drupal refuses no longer leaves an `undefined` entry in a cached resource's `included`, so the resource matches what Drupal returns for a fresh request.
