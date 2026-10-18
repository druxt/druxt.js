---
'druxt-breadcrumb': patch
'druxt-menu': patch
'druxt-views': patch
---

Theme components built on the menu, breadcrumb and views mixins stop rendering module data in their markup.

A module hands its theme component everything it sends, and a key the theme does not declare is an HTML attribute on the theme's root element. `DruxtMenuMixin` and `DruxtBreadcrumbMixin` now declare `value`, so a menu or breadcrumb theme no longer renders `value="[object Object]"`. The views filter, filters, pager and sorts mixins now declare `langcode`, so those themes no longer render `langcode="en"`.

A theme that reads `value` or `langcode` from `$attrs` reads it from the prop instead. A theme that doesn't declare the props still renders module data on 0.x: add the module's mixin, or set `inheritAttrs: false` on it.
