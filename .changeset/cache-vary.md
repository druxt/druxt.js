---
'druxt': minor
---

feat(#1017): a `cache.vary` setting lists the request headers that change Drupal's answer, so the server process cache keeps their answers apart. A site whose Drupal picks the language from `Accept-Language` sets:

```js
export default {
  druxt: {
    cache: { vary: ['Accept-Language'] },
  },
};
```

Requests that send different values for a listed header no longer share a cached response, and a response whose `Vary` names a listed header can now be cached. Each value takes a share of `cache.maxSize`, and a cache area keeps at most 32 of them. On a server render, `@nuxtjs/axios` passes on the visitor's own `Accept-Language`, so list a header only when Drupal's answer depends on it. A site that leaves `cache.vary` unset sees no change.
