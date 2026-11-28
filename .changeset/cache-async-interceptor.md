---
'druxt': patch
---

fix(#1064): a signed-in request whose token comes from an `async` request interceptor, or one that returns a promise, no longer gets a response cached for anonymous visitors. Druxt couldn't see such a token before the cache lookup.

The server cache now waits for the first response on an Axios instance with such an interceptor before using it. A site using `@nuxtjs/auth-next` sends the first request of each server render to Drupal. As before, a token on the Axios defaults turns the cache off from the first request. `@nuxtjs/auth-next` puts it there unless `token.global` is off.
