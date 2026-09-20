---
'druxt': patch
---

The Druxt store now shares a request that is already in flight. Components that ask for the same resource or collection concurrently make one backend request between them. A failed request is not kept, so the next call tries again.
