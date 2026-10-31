---
'druxt': patch
---

Fix a query object with nested values, such as a `filter`, which reached Drupal empty.

`getCollection()`, `getResource()` and `getRelated()` given a plain object now send nested values in bracket notation, as Drupal's JSON:API expects, where Drupal answered 400 before.

```js
await this.$druxt.getCollection('node--page', {
  filter: { status: 1 },
  page: { limit: 5 },
});
// /jsonapi/node/page?filter[status]=1&page[limit]=5
```
