---
'druxt-router': patch
---

A route fetched across a flush is no longer stored, but the page still renders it, so the title, breadcrumb and block regions follow the page shown. `druxtRouter/setRoute` also takes `{ path, route }`.

Commit: 75b37680976671879b03eaf2eb046d799456f5ef
