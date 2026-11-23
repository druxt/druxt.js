---
'druxt-entity': patch
---

fix(#1019): saving a `DruxtEntityForm` now stores what Drupal returns, so the rest of the page shows the saved entity. Before, the save never reached the store. Reset now returns the form to the saved entity, where before it kept the edits.
