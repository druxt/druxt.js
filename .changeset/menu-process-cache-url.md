---
'druxt-menu': patch
---

fix(#1018): menus get the same credentials check against their own URL, so an interceptor that adds credentials only to menu requests also turns the server cache off.
