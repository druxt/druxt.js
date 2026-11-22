---
'druxt-views': minor
---

feat(#1043): a view writes its exposed filters, its page and its sort to the URL query as they change, so reloading the page or sharing its link shows the same results.

Before, the URL kept only the keys it held when the view opened. A value that goes back to its default is removed. The rest of the query stays as it is, and the browser history doesn't get an entry for each change.

On a page with more than one view, set `:settings="{ route: false }"` on all but one of them, so that only one writes `page`. `views.route: false` in `nuxt.config.js` turns it off for every view.
