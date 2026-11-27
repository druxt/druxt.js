---
'druxt-entity': patch
---

fix(#1019): saving a `DruxtEntityForm` now stores what Drupal returns, so the rest of the page shows the saved entity. Before, the save never reached the store. Reset now returns the form to the saved entity, where before it kept the edits.

A form now saves to the translation it shows. That is the language of its `langcode` prop, or of the route when it has none, such as `es` on a page under `/es`. Before, it sent the request without a language prefix, which wrote to the default language. A form doesn't save or reset while the next language loads.
