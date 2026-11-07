---
'druxt-views': minor
---

feat(#398): load more. A display with the Views Infinite Scroll pager adds each page below the results before it, under a link with the pager's button text, and loads the next page as the link scrolls into view when the pager loads automatically. `?page=2` renders the first three pages, so a shared URL lists what the reader had loaded. Set `pager.loadMore` in the views settings to load more on any pager, or to page through an infinite scroll display:

```vue
<DruxtView view-id="recipes" :settings="{ pager: { loadMore: true } }" />
```
