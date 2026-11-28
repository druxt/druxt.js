---
'druxt-views': patch
---

fix(#1085): a view whose results request fails no longer logs a Vue warning about the pager's `resource` prop on every render. The view now renders with no results, as it did, and without the warning.
