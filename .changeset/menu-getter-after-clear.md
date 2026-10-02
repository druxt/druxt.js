---
'druxt-menu': patch
---

A menu renders again after `druxt/clearCache`, where it used to throw. The clear empties every prefix at once, and the getter then read a prefix that was no longer there, so a page with a menu failed to render until its next fetch.
