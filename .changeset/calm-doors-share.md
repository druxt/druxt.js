---
'druxt': patch
---

The Druxt store now shares a request that is already in flight. Components that ask for the same resource or collection at the same time make one backend request instead of one each. A failed request is not kept, so the next call tries again.
