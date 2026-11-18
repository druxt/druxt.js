---
'druxt-site': patch
---

fix(#545): `DruxtSiteMixin` can be imported in client-side code. Importing anything from `druxt-site` no longer pulls Node's `fs` into the client bundle, which made webpack fail with "This dependency was not found: fs".
