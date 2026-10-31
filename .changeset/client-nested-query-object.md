---
'druxt': patch
---

fix(#962): a query object with nested values, such as a `filter`, reaches Drupal in bracket notation. It was sent empty, and Drupal answered 400.

`getCollection()`, `getResource()` and `getRelated()` take a plain object with nested values, as Drupal's JSON:API expects.

```js
await this.$druxt.getCollection('node--page', {
  filter: { status: 1 },
  page: { limit: 5 },
});
// /jsonapi/node/page?filter[status]=1&page[limit]=5
```
