---
'druxt': patch
---

Every `sessionCookie` pattern on a shared Axios instance is now checked, so clients sharing one instance can't keep a signed-in response in the server cache for anonymous visitors.
