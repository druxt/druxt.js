---
'druxt-breadcrumb': patch
'druxt-menu': patch
'druxt-views': patch
---

fix(#945): themes built on the menu, breadcrumb and views mixins no longer render module data as HTML attributes, such as `value="[object Object]"` or `langcode="en"`. A theme that read `value` or `langcode` from `$attrs` reads it from the prop.
