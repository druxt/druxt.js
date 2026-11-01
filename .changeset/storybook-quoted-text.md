---
'druxt-blocks': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-site': patch
'druxt-views': patch
---

fix(#905): generated Storybook stories compile when a Drupal label, title or description contains a quote mark or a backslash.

Text such as "The documentation's sections" stopped Storybook compiling the story. Text reworded in Drupal to avoid the error can be changed back.
