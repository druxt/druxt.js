---
'druxt': patch
---

The `druxt/getResource` action now reports a failed request. A failure adds an `error` property to the returned document, `{ statusCode, message }`, so a caller can tell an authentication failure from a resource that does not exist. Every dispatch that shared the request is told, and a request that never reached Drupal reports a status of 500. Previously the status was discarded and the caller received an empty object, which reads as a missing resource.
