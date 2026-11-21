---
'druxt': patch
---

fix(#1018): a signed-in request no longer gets a response cached for anonymous visitors on a site that adds credentials in a synchronous Axios request interceptor. Before, the server cache could serve such an entry until a response showed the credentials.

Before each cache lookup, Druxt now runs the site's request interceptors on a copy of the request to see whether it would carry credentials. An `async` interceptor isn't called. When one returns a promise or throws, Druxt ignores what it returns. Credentials from either are seen only once a response arrives, as before, and that includes credentials a synchronous interceptor adds from state an `async` one sets. A request answered from the cache sends nothing, so on such a site a signed-in request can keep reading an anonymous entry until it expires, as in 0.25.1.

Sites using `@nuxtjs/auth-next` keep the cache for anonymous visitors, and a signed-in user's token, which auth-next puts on the Axios defaults with its default `token.global: true`, still turns the cache off as in 0.25.1. An interceptor with side effects, such as logging, can leave the check alone by testing `config[Symbol.for('druxt.processCache.probe')]`.
