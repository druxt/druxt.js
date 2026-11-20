---
'druxt': patch
---

fix(#1018): a signed-in request no longer gets a response cached for anonymous visitors on a site that adds credentials in a synchronous Axios request interceptor. Before, the server cache could serve such an entry until a response showed the credentials.

Before each cache lookup, Druxt now runs the site's request interceptors on a copy of the request to see whether it would carry credentials. An interceptor that is `async`, returns a promise or throws is skipped, and anything it adds is seen once a response arrives, as before. That includes credentials a synchronous interceptor adds only from state an `async` one sets, so on such a site the first request can still read an anonymous entry.

Sites using `@nuxtjs/auth-next` keep the cache for anonymous visitors, and a signed-in user's token, which auth-next puts on the Axios defaults, still turns the cache off as in 0.25.1. An interceptor with side effects, such as logging, can leave the check alone by testing `config[Symbol.for('druxt.processCache.probe')]`.
