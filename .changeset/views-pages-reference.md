---
'druxt-views': minor
---

Views pages: `druxt.views.pages` declares a route pattern for a View, and the new DruxtViewsPage component writes the view's arguments, filters, sort and page to the URL on every change, with no reload. DruxtView takes a `value` and emits `input`, and the pager's links follow the page. A reference for the 2.0.0 views rewrite, from issue #399.
