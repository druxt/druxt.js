---
'druxt': minor
'druxt-menu': patch
---

In production, the server now keeps the JSON:API index and menus between requests for as long as Drupal's `Cache-Control` header allows. Drupal only allows it when the page cache max-age is set (Administration > Configuration > Development > Performance). At the default of 0, nothing is kept.

Nothing fetched for a signed-in user is ever kept. Drupal marks every response to a signed-in request `no-cache`, for a session cookie and for an OAuth token alike. Druxt never stores a response marked `no-cache`.

A signed-in request also never reads the cache, so a signed-in user is not shown the anonymous menu. Druxt recognizes a signed-in request by an Authorization header, basic auth or Drupal's session cookie. Set `sessionCookie` only when a proxy renames that cookie between the browser and Nuxt while Drupal still receives its own:

```js
// nuxt.config.js
export default {
  druxt: {
    cache: {
      ttl: 60, // optional: keep a response at most this many seconds, 0 keeps nothing
      sessionCookie: 'MY_CUSTOM_SESSION[0-9a-f]+',
    },
  },
};
```

A response whose `Vary` header names a request header the visitor's browser sends is not kept, since the cache cannot tell such variants apart. A Druxt backend sends `Vary: Cookie` and, from the consumers module, `Vary: X-Consumer-ID`, both of which are fine: neither is set by a browser, and a client that sends `X-Consumer-ID` keeps entries of its own. A proxy or module in front of Drupal may add `Accept-Language`, `Origin` or `User-Agent`, and those responses then stay uncached.

`Vary: Cookie` is treated as Drupal's own page cache treats it: requests without a session cookie share one response, whatever other cookies they send. Modules that change a response by some other cookie, such as a consent or region cookie, are not covered. Name that cookie in `sessionCookie` so requests with it never read or fill the cache, or turn the cache off.

Menus are kept between requests only with druxt 0.25.0 or later, which this release of druxt-menu requires.

A cache between Nuxt and Drupal that removes `no-cache` from responses breaks this, as it breaks Drupal's own caching.

Set `druxt.cache: false` to turn it off. It is off under `nuxt dev`.
