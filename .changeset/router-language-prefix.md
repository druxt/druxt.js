---
'druxt': patch
'druxt-router': patch
---

fix(#1065): a page in another language now loads in that language. The router asked Decoupled Router without the path's language prefix, so `/es/recipes` loaded in English and redirected to `/recipes`, and a link to `/es` ended on the English home page.

The router now asks under the prefix the path starts with, from the `prefixes` setting, and the API proxy adds a Decoupled Router path for each prefix.
