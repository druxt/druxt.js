---
'druxt': patch
---

Every `sessionCookie` pattern on a shared Axios instance is now checked, so clients sharing one instance can't cache a signed-in response for anonymous visitors.
