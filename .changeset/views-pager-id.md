---
'druxt-views': patch
---

fix(#1049): a view whose pager ID isn't 0 now pages. Drupal reads each pager's page from its place in `page`, such as `page=0,2` for page 2 of pager 1, and the view and its pager sent and read a bare `page=2`, which Drupal reads as pager 0's.
