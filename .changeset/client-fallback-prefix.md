---
'druxt': patch
---

Views, and other types the JSON:API index doesn't list, are fetched in the requested language, not the default language. A `DruxtClient` endpoint given without a leading slash, such as `api`, now works with a language prefix.
