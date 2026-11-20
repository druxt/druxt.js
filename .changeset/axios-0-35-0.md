---
'druxt-blocks': patch
'druxt-views': patch
---

fix(#1029): `druxt-blocks` and `druxt-views` install axios 0.35.0.

A site can stay on axios 0.34.0, which `druxt` still accepts, though its bundle may then hold both copies.
