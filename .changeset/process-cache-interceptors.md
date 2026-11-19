---
'druxt': patch
---

fix(#1018): a site whose Axios instance adds credentials in a synchronous request interceptor no longer reads the shared process cache, from its first request. Before, it could read an entry stored for anonymous visitors until a response showed the credentials.

The cache runs the instance's request interceptors on a probe before each lookup, with the request's URL and in the order Axios runs them, and with Axios 1's header methods such as `config.headers.set()`. An interceptor that is `async`, returns a promise or throws on the probe is passed over, and what it adds is seen once a response comes back, as before. Sites using `@nuxtjs/auth-next`, which adds an `async` interceptor, keep the cache for anonymous visitors. An interceptor that logs can leave the probe alone by checking `config[Symbol.for('druxt.processCache.probe')]`.
