---
'druxt-views': patch
---

fix(#758): view attachments use their intended `ref` name. Only code reading `this.$refs` on a `DruxtView` is affected.
