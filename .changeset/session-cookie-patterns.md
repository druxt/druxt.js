---
'druxt': patch
---

Where clients share one Axios instance and each sets its own `sessionCookie`, only the first pattern was checked for credentials added while a request was sent. A session cookie matching any later pattern did not mark the instance as credentialed, so an authenticated response could be kept in the shared cache and served to an anonymous request. Every pattern registered on an instance is now checked.
