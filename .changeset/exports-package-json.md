---
'druxt': patch
'druxt-blocks': patch
'druxt-breadcrumb': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-router': patch
'druxt-schema': patch
'druxt-site': patch
'druxt-views': patch
'druxt-test-utils': patch
---

fix(#835): each package exports its `package.json`, so `require('druxt/package.json')` works.
