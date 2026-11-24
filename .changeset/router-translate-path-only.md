---
'druxt-router': patch
---

fix(#1055): a page opened with a query string, such as `/recipes?page=2`, now resolves. The router sent the query to Decoupled Router as part of the path, which Drupal couldn't find, so the page showed a 404.
