---
'druxt-views': patch
---

fix(#1032): changing an exposed filter on a later page of a view goes back to the first page, as a Drupal-rendered view does. Before, it asked for the same page of the filtered results, which was often empty.
