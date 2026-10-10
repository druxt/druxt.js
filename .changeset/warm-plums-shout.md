---
'druxt-views': patch
---

Fixed the internal `ref` name of View attachments. Only code reading `this.$refs` on a `DruxtView` is affected.
