---
'druxt': patch
---

fix(#781): `getCollection` returns full resources in `included` on a cache hit, as a fresh fetch does. A resource removed with `flushResource` is fetched again.
