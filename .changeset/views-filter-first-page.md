---
'druxt-views': patch
---

fix(#1032): changing an exposed filter on a later page of a view goes back to the first page, as a Drupal-rendered view does. Before, it asked for the same page of the filtered results, which was often empty.

A view opened with `page`, `filter` or `sort` in the URL keeps those keys up to date without adding to the browser history, and drops `page` when a filter changes. A key that wasn't in the URL when the view opened isn't added, so that choice is lost on reload. Views on one page share these keys, and a second view keeps its own values until the page reloads.
