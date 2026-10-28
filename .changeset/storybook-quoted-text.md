---
'druxt-blocks': patch
'druxt-entity': patch
'druxt-menu': patch
'druxt-site': patch
'druxt-views': patch
---

fix(#905): generated Storybook stories load when a Drupal label, title or description holds a quote.

A menu, view, block or entity name such as "The documentation's sections" stopped Storybook from compiling its story. Sites that reworded the text in Drupal to avoid the error can change it back.
