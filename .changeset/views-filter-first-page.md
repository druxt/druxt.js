---
'druxt-views': patch
---

fix(#1032): changing an exposed filter on a later page of a view goes back to the first page, as a Drupal-rendered view does. Before, it asked for the same page of the filtered results, which was often empty.

A view opened from a URL with `page`, `filter` or `sort` in its query now updates them as they change, so reloading shows what the view showed. Before, the URL still named the page it was opened on. A URL without them is left unchanged.
