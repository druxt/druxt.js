---
'druxt': minor
'druxt-menu': patch
---

In production, the server now keeps the JSON:API index and menus between requests for as long as Drupal's `Cache-Control` header allows. Drupal only allows it when the page cache max-age is set (Administration > Configuration > Development > Performance). At the default of 0, nothing is kept.

A request with an Authorization header, basic auth or a Drupal session cookie never reads or fills the cache. If a proxy renames the session cookie, set `sessionCookie` to match it:

```js
// nuxt.config.js
export default {
  druxt: {
    cache: {
      ttl: 60, // optional: keep a response at most this many seconds
      sessionCookie: 'MY_CUSTOM_SESSION[0-9a-f]+',
    },
  },
};
```

A response that Drupal says varies by a request header other than the cookie, such as `Accept-Language` when browser language detection is on, is not kept. The cache cannot tell such variants apart.

Set `druxt.cache: false` to turn it off. It is off under `nuxt dev`.
