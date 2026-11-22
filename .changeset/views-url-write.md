---
'druxt-views': minor
---

feat(#1043): a view writes its exposed filters, its page and its sort to the URL query as they change, so reloading the page or sharing its link shows the same results.

Before, the URL kept only the keys it held when the view opened. A value that goes back to its default is removed. The rest of the query stays as it is, and the browser history doesn't get an entry for each change.

On a page with more than one view, each view keeps to what Drupal gives it. Its page goes in its pager's place in `page`, so `?page=0,2` is page 2 for pager 1, and its exposed filters go under their identifiers. Views share a filter only when their filters have the same identifier, and a view follows a change another view makes to it. Give each view's pager its own ID in the view's pager settings. `:settings="{ route: false }"` keeps a view out of the URL, and `views.route: false` in `nuxt.config.js` turns it off for every view.
