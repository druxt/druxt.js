---
'druxt': patch
'druxt-blocks': patch
'druxt-breadcrumb': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-router': patch
'druxt-schema': patch
'druxt-site': patch
'druxt-test-utils': patch
'druxt-views': patch
---

Each package exports its own `package.json`, so `require('druxt/package.json').version` works. The exports map refused the path before.
