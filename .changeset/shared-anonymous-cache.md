---
'druxt': minor
'druxt-menu': patch
---

The JSON:API index and menus are now cached on the server between requests, for five minutes, in production. An Authorization header (basic auth included) or a cookie matching Drupal's session pattern, `SESS` or `SSESS` plus a hash, marks a request as credentialed and keeps it out of the cache. This keeps a logged-in user's response from being served to, or stored on behalf of, anyone else.

A backend behind a proxy that renames the session cookie needs `sessionCookie` set to match it:

```js
// nuxt.config.js
export default {
  druxt: {
    cache: {
      ttl: 60, // seconds; 0 disables the cache
      sessionCookie: 'MY_CUSTOM_SESSION[0-9a-f]+',
    },
  },
};
```

Set `druxt.cache: false` to turn the cache off entirely. It is already off under `nuxt dev`, and for a `DruxtClient` created without the `cache` option.
