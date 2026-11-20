---
'druxt-menu': patch
---

fix(#1018): the server cache checks a menu request's own URL and query for credentials a request interceptor adds, so a site that signs only menu requests no longer gets a menu cached for anonymous visitors on a signed-in request.
