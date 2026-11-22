---
'druxt': patch
'druxt-blocks': patch
'druxt-views': patch
---

fix(#1029): `druxt` needs axios 0.35.0 or later, the version `druxt-blocks` and `druxt-views` now install.

A site that pins axios 0.34.0 should move to 0.35.0, so its bundle holds one copy.
