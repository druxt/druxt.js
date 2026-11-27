---
'druxt-router': patch
---

fix(#1055): a page opened with a query string, such as `/recipes?page=2`, now resolves. The router sent the query to Decoupled Router as part of the path, which Drupal couldn't find, so the page showed a 404.

A redirect to the page's clean URL, or to the home path, keeps the query string and the hash, so `/node/1?page=2` goes to `/recipes?page=2`.
