---
"druxt-entity": minor
---

Added **settings** property to the DruxtEntity and DruxtEntityForm components.

```vue
<template>
  <DruxtEntity
    :settings="{ query: { include: ['uid'] } }"
    type="node--page"
    :uuid="uuid"
  />
</template>
```
