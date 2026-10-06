---
'druxt': patch
---

A resource of a type the JSON:API index does not list, such as a View, is fetched under the language prefix it was asked for. The client dropped the prefix for such types, so every View rendered in the site's default language.

A `DruxtClient` constructed with an endpoint that has no leading slash, such as `api`, now adds one, so a prefix joins it as `/es/api` without a missing slash.
