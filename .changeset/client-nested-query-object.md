---
'druxt': patch
---

fix(#962): a query object with nested values, such as a `filter`, reaches Drupal as `filter[status]=1`. It was sent as `filter=`, and Drupal answered 400.

`getCollection()`, `getCollectionAll()`, `getResource()` and `getRelated()` all send it this way. A nested `null` or `undefined` value is left out, and top-level values are sent as before.

```js
await this.$druxt.getCollection('node--page', {
  filter: { status: 1 },
  page: { limit: 5 },
});
// /jsonapi/node/page?filter[status]=1&page[limit]=5
```
