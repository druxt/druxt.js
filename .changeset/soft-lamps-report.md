---
'druxt': patch
---

fix(#1013): `druxt/getResource` reports a failed request: the returned document gets an `error` property, `{ statusCode, message }`, so a caller can tell a 401 from a missing resource. A request that never reached Drupal reports 500.

A refused include no longer leaves an `undefined` entry in a cached resource's `included`. The resource is returned without it, as Drupal returns a fresh one.
