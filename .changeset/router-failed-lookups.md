---
'druxt-router': patch
---

fix(#881): a route lookup that fails without a 4xx, such as a network error, is no longer stored, so the next visit tries again.
