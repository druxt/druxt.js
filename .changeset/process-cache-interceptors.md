---
'druxt': patch
---

fix(#1018): a request interceptor that adds credentials now turns the server cache off from the first request. Before, the cache stayed on until a response showed the credentials, so a signed-in visitor could get a response cached for anonymous visitors.

This covers interceptors that add credentials synchronously. Credentials that depend on an `async` interceptor are still seen only once a response arrives, as in 0.25.1. `@nuxtjs/auth-next` puts its token on the Axios defaults unless `token.global` is off, and that already turns the cache off.

Druxt runs request interceptors on a copy of the request before each cache lookup. An interceptor with side effects, such as logging, can skip that run by checking `config[Symbol.for('druxt.processCache.probe')]`.
