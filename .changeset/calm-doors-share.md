---
'druxt': patch
---

fix(#857): concurrent requests for the same resource or collection share one backend request. A failed request isn't kept, so the next call tries again.
