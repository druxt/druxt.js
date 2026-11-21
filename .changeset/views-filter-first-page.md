---
'druxt-views': patch
---

fix(#1032): changing an exposed filter on a later page of a view goes back to the first page, as a Drupal-rendered view does. Before, it asked for the same page of the filtered results, which was often empty.

A view opened with `page`, `filter` or `sort` in the URL's query now keeps those keys up to date as the visitor changes them, and drops `page` when a filter changes. The URL is replaced, so the browser history doesn't grow. Before, the URL kept the page the view was opened on. The view only updates keys already in the URL, so a filter picked while the URL held no `filter` key is lost on reload. Views on one page share these keys. A second view reads them when it opens and resets when the query is emptied, but otherwise keeps its own values until the page reloads.
