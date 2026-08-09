---
'druxt-views': patch
---

Fixed a typo in the internal Vue `ref` name used for recursively-rendered
`attachments_before`/`attachments_after` view attachments. This is not part
of the documented public API - the scoped slot names (`attachments_before`,
`attachments_after`) were already spelled correctly and are unaffected - but
if you have custom code reading `this.$refs` directly on a `DruxtView`
instance for these attachment refs, verify the ref name still matches after
upgrading.
