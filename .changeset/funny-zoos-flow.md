---
"druxt-blocks": minor
"druxt-breadcrumb": minor
"druxt": minor
"druxt-entity": minor
"druxt-menu": minor
"druxt-router": minor
"druxt-site": minor
"druxt-views": minor
---

Moved Vue components out of bundle

⚠ Potential breaking change

_**Note:** This only effects custom Druxt modules and implementations._

Update:
```js
import { DruxtModule } from 'druxt'
```

To:
```js
import DruxtModule from 'druxt/dist/components/DruxtModule.vue'
```
