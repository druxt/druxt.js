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
---

The README banner now renders on npm. Each package's `repository` field names its own directory in the monorepo, so npm resolves the banner image against `packages/<name>` instead of the repository root, where it did not exist.
