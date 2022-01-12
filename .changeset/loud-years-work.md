---
"druxt-entity": minor
---

Updated DruxtRouterEntity to use Full view mode.

⚠ Potential breaking change

_**Note:** This may effect the rendered template if the Full view mode is configured in Drupal._

```diff
-components/DruxtEntityNodePageDefault.vue
+components/DruxtEntityNodePageFull.vue
-components/druxt/entity/node/page/Default.vue
+components/druxt/entity/node/page/Full.vue
```
