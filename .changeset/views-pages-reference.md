---
'druxt-views': minor
---

feat(#399): views pages. `druxt.views.pages` declares a route pattern for a View, and the new DruxtViewsPage component writes the view's arguments, filters, sort and page to the URL on every change, with no reload. DruxtView takes a `value` and emits `input`, and the pager's links follow the page. A list inside a page you route yourself gets the same behaviour from DruxtViewsPage's `page` prop or `DruxtViewsPageMixin`, and keeps the params that page owns. A reference for the 2.0.0 views rewrite.
