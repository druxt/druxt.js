---
'druxt-entity': minor
---

feat(#517)!: the deprecated `DruxtField` components are no longer registered by default. Set `druxt.entity.components.fields: true` to keep them.

```js
// nuxt.config.js
export default {
  druxt: {
    entity: { components: { fields: true } },
  },
};
```
