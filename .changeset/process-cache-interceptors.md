---
'druxt': patch
---

fix(#1018): a site whose Axios instance adds credentials in a request interceptor no longer reads the shared process cache, from its first request. Before, it could read an entry stored for anonymous visitors until a response showed the credentials.

The cache runs the instance's request interceptors on a probe before each lookup. When an interceptor is `async`, returns a promise or throws on the probe, the cache can't tell what it adds, so it stays off for that instance. An interceptor that logs can leave the probe alone by checking `config[Symbol.for('druxt.processCache.probe')]`.
