---
'druxt': patch
---

`druxt/getResource` reports a failed request: the returned document gets an `error` property, `{ statusCode, message }`, so a caller can tell a 401 from a missing resource. A request that never reached Drupal reports 500.
