---
'druxt': patch
---

fix(#1013): the document `druxt/getResource` returns for a failed request has an `error` property, `{ statusCode, message }`, so a caller can tell a 401 from a missing resource. A request that never reached Drupal reports 500. Before, nothing in the document said the request had failed.

An include that Drupal refuses no longer leaves an `undefined` entry in a cached resource's `included`.
