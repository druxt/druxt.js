---
'druxt': patch
---

fix(#966): `new DruxtClient(baseUrl)` sends requests through the Axios `baseURL` or the proxy, as passing `{ baseUrl }` in the options already did. Before, requests went straight to the Drupal host, because the links read from the JSON:API index still included it.

`DruxtRouter`, `DruxtSchema` and `DruxtMenu` created with a base URL alone change the same way. The Nuxt module passes the base URL both ways, so sites that only use the module are unaffected. A custom `axios` instance in the options now needs its own `baseURL`, and code that passed the base URL both ways can drop the option.
