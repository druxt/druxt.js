---
'@druxt/client': major
---

feat(#979)!: add `@druxt/client`, the JSON:API client split out of 1.x's `druxt` package, with no Vue, Nuxt or HTTP dependency.

Requests go through the Fetch API: the `fetch` and `headers` options replace the Axios instance, and an `axios` option is ignored. The 0.25.0 cache behaviour carries over: the Cache-Control-aware process cache, the bypass for credentialed and session-cookie requests, `cache.ttl` and `clearCache()`. druxt-auth's OAuth flows live here now: PKCE, the password and client credentials grants, token refresh, and a retry after a 401. `auth.refresh.share` shares a refresh between clients holding one session, as a server's renders of one browser do.

A resource URL for a type the JSON:API index does not list now keeps the language prefix, and `getCollection` fetches that fallback URL instead of returning `false`.

`getResource()`, `getRelated()`, `createResource()` and `updateResource()` throw a `TypeError` naming an empty type, id or related field name. 1.x returned `false`.

`getCollection()` and `getCollectionAll()` throw a `TypeError` on an empty type. 1.x requested the bare JSON:API endpoint.

`createResource()` and `updateResource()` send the POST or PATCH for a type the index does not list. A type Drupal does not expose rejects with the request's `DruxtError`. 1.x returned `false` without sending anything.

A `baseUrl` in the options wins over the constructor's argument, as in 1.x, and requests now go to it too. 1.x's Axios instance sent them to the argument.

`getIndex(type)` and `auth.getUser()` answer `undefined` instead of `false`, and `addHeaders()` returns nothing.

`auth.session` is for a browser whose site's server holds the tokens, in httpOnly cookies, behind a proxy that adds the `Authorization` header. The client then holds only the `druxt.auth.session` marker and sends no `Authorization` header. It refreshes through `tokenUrl`, with no refresh token of its own, and signs out through `logoutUrl`. A request made with `auth: false` asks the proxy for no credentials with `X-Druxt-Auth: none`. `auth.logout()` returns a promise. Under `auth.session` it posts to `logoutUrl` first and forgets the session only once that route answers with a 2xx; otherwise it rejects with the request's error and the session is kept.

A refresh token Drupal refuses, with a 400 or a 401, ends the session, and a read refused with it is repeated as the anonymous visitor, asking the proxy for no credentials under `auth.session`, while a write is not. Other refresh failures, such as a timeout, keep the session. If Drupal refuses an access token with a 401 and there is no refresh token to try, a read sent to Drupal ends the session and is repeated anonymously. A write, or another host's 401, does neither. The session of a sign-in made while a refused refresh or read was pending is kept. A sign-in or refresh that answers after a later sign-in or a sign-out stores nothing and rejects with an error whose `superseded` is true.

The access token goes only to the origin the client sends Drupal's requests to: the base URL's, or the page's own when the API is proxied. A request to another host is sent without it, and its 401 is returned as it is, with no refresh or retry. Headers set with `headers` or `addHeaders()` are still sent to every host.

`auth` is `undefined`, not `null`, when auth is off. `processCache()` answers `undefined`, not `null`, when the cache must not be used.

BREAKING CHANGE: `DruxtClient` is imported from `@druxt/client`, and the Axios instance and every `axios` option are gone, `axios.headers` among them: set headers in `headers`.

`DruxtClient` no longer has a `settings` property holding the module settings. `clientOptions()` picks the client's options out of a site's config, and `resolveDruxtSettings()` merges the module settings from several sources.

`connectionsFrom()` builds the `default` connection from a site's flat config. A connection has one `consumer` (the Simple OAuth client, from `build.auth` or else `auth.clientId`), and an optional `browser` sign-in override. Any connection under another name is listed as ignored, because those names are reserved for 2.1.0. A module that reads decoupled settings names the Consumer in an option of its own, since the client has none. `clientOptions()` takes a connection or the flat config and returns a deep copy, and never copies a Consumer's secret.

An `onRequest` option and `client.onRequest()` report each request's method, URL, status and duration, for logging and metrics. They see no headers or bodies, and secret query values such as `token` and `code` are emptied from the URL.

A request listener's `end` event carries `omitted`, Drupal's reason, when Drupal omitted resources from the response. With `warnOmitted`, the client warns once per omitted resource type for each site until `clearCache()`, with `DRUXT_E01001`, naming each type the omitted items' links name and quoting the reason. `omittedResources()` reads what a document omitted, its reason and each omitted type and id, without the links.

`prefixes` maps each langcode to the URL prefix Drupal serves it under, `{ en: '', es: 'spanish' }`, so a method's `prefix` argument takes a langcode as well as a prefix. A langcode the map lacks is used as the prefix itself, as before. `urlPrefix()` gives the mapping.

A nested null in a query object is left out of the query string, as an `IS NULL` condition must have no value.

A request body that is a plain object or an array is sent as JSON:API JSON. A `Blob`, a buffer, a typed array, `FormData` or a stream is sent as it is, as 1.x's Axios sent it, for a file upload.
