---
'druxt-menu': patch
---

fix(#1017): a menu fetched on the server is stored for the headers its request was sent with. With the `cache.vary` setting of druxt, a header that changed while the request ran could put the menu among another language's.
