# @druxt/client

The Druxt JSON:API client for Drupal, with no Vue or Nuxt dependency. It runs
in Node, a browser or any framework, on the Fetch API.

```ts
import { DruxtClient } from '@druxt/client';

const druxt = new DruxtClient('https://demo-api.druxtjs.org');
const recipes = await druxt.getCollection('node--recipe', { 'page[limit]': 3 });
```

**`get()`, `request()`, `createResource()` and `updateResource()` return the HTTP response, whose `data` is the JSON:API document. The read methods return the document itself, and `getCollectionAll()` an array of them, one per page.**

- **Resources:** `getResource`, `getCollection`, `getCollectionAll`,
  `getRelated`, `createResource` and `updateResource`. A method given an empty
  required argument throws a `TypeError`. A method that can find nothing answers
  `undefined`.
- **Index:** the JSON:API index is fetched once, decorated with JSON:API
  Extras' resource config when it is readable.
- **Process cache:** off unless the `cache` option is set. On a server it then
  keeps the JSON:API index, fetched without credentials, between requests for
  as long as its `Cache-Control` allows. With `cache: { content: true }` it also
  keeps each `get()` answered with a 200 whose body is a JSON document and
  that `Cache-Control` lets a shared cache store, for a request without credentials or options that could change
  the response, such as headers or a body. A `bypassCache` request goes to
  Drupal, and its answer replaces the entry when it may be stored and removes
  it otherwise, as a 404 does. A request that never reaches Drupal leaves the
  entry. An answer to a read that started before the one whose answer was
  stored, or removed the entry, isn't kept. `cache: { ttl }` caps the
  lifetime, and
  `clearCache()` empties it. Each set of client headers keeps its own entries,
  and an answer to a request in flight when the client's headers changed is
  stored under neither set. `cache.maxSize` bounds each cache area across all
  its sets: an area holds one kind of answer, such as the content or a
  module's menus. Past it the area's least recently used entries go,
  whichever set holds them. An area also keeps a fixed number of sets, the
  least recently used going first.
- **Auth:** with `auth: { clientId }`, Simple OAuth's authorization code
  (PKCE), password and client credentials grants, with refresh. An expired
  token is refreshed before the request is sent, and a 401 from Drupal's
  origin is refreshed and the request sent again once, as the same session.
  When Drupal refuses the refresh token, the session ends, and a read is
  repeated anonymously while a write is not. A write refused that way before
  it is sent isn't sent at all, and rejects with the refusal. With no refresh
  token to try, a 401 to a read ends the session and the read is repeated
  anonymously, while a write's 401 does neither. A refresh that fails
  otherwise, such as a timeout, keeps the session, and the 401 stands. A
  stream body is never sent twice: a 401 to it still refreshes, and stands for
  the caller to retry with a new stream. Another host's 401 is returned as it
  is, as is one answered after another session signed in. A sign-in or
  refresh that a later sign-in or a sign-out replaced while it ran stores
  nothing. It rejects with an error `isSuperseded(error)` tells from a failure
  when it succeeded, and with its own error when it failed, as does a request
  still waiting on a refresh when another session signs in. A sign-in ends
  the session held as it starts, so one that fails leaves none, as
  druxt-auth 0.x did, and nothing is sent as the user before while it runs.
  A session signed in since the last refresh refreshes on its own, within
  the grace too. A `logout()`
  that succeeds ends the session, even one a sign-in stored while the site's
  logout route ran, so the next sign-in starts afresh. When that route fails,
  it rejects and the session is kept.
- **Transport:** `fetch` and `headers` options, with `globalThis.fetch` by
  default. 1.x's Axios instance and its `axios` options are gone, and an
  `axios` option is ignored: set headers in `headers`. Client headers set there
  or with `addHeaders()` go with every request, except `Authorization`,
  `Proxy-Authorization` and `Cookie`, which go only to Drupal's origin, as the
  access token does. A header passed to the request itself is sent as given.
- **Request hook:** the `onRequest` option, or `client.onRequest(listener)`,
  is told each request's method and URL as it starts, then its status and
  duration as it ends. It never sees headers or bodies, the URL has no user name
  or password, and the values of `token`, `access_token`, `code`, `password` and
  `client_secret` query keys are emptied. Other query values pass as sent. It
  suits logging and metrics.
- **Omitted resources:** when Drupal omits resources from a response, as for
  lack of permission, the listener's `end` event carries `omitted`, Drupal's
  reason. With `warnOmitted`, the client warns once per resource type for
  each site until `clearCache()`, with `DRUXT_E01001`, naming each omitted
  type and quoting the reason. Druxt's Nuxt module turns it on in
  development, for the page's client and the server's. `omittedResources(document)` reads what a document omitted: the
  reason and each omitted type and id, without the links.
- **Logging:** a `logger` option takes consola, or anything with `info` and
  `warn`. Without one, the client logs to `console`. Druxt's Nuxt module
  passes consola.

Public modules, the ones `src/index.ts` re-exports, live in `src/`, and internal helpers in `src/utils/`.
