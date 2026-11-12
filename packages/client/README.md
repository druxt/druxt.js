# @druxt/client

The Druxt JSON:API client for Drupal, with no Vue or Nuxt dependency. It runs
in Node, a browser or any framework, on the Fetch API.

```ts
import { DruxtClient } from '@druxt/client';

const druxt = new DruxtClient('https://demo-api.druxtjs.org');
const recipes = await druxt.getCollection('node--recipe', { 'page[limit]': 3 });
```

**`get()`, `request()`, `createResource()` and `updateResource()` return the HTTP response, whose `data` is the JSON:API document. The read methods return the document itself.**

- **Resources:** `getResource`, `getCollection`, `getCollectionAll`,
  `getRelated`, `createResource` and `updateResource`. A method given an empty
  required argument throws a `TypeError`. A method that can find nothing answers
  `undefined`.
- **Index:** the JSON:API index is fetched once, decorated with JSON:API
  Extras' resource config when it is readable.
- **Process cache:** off unless the `cache` option is set. On a server it then
  keeps the JSON:API index, fetched without credentials, between requests for
  as long as its `Cache-Control` allows. With `cache: { content: true }` it also
  keeps each `get()` answered with a 200 that `Cache-Control` lets a shared
  cache store, for a request without credentials or options that could change
  the response, such as headers or a body. A `bypassCache` request goes to
  Drupal and stores its fresh answer. `cache: { ttl }` caps the lifetime, and
  `clearCache()` empties it.
- **Auth:** with `auth: { clientId }`, Simple OAuth's authorization code
  (PKCE), password and client credentials grants, with refresh. A 401 is
  refreshed and retried once. A sign-in or refresh that a later sign-in or a
  sign-out replaced while it ran stores nothing and rejects, and
  `isSuperseded(error)` tells that rejection from a failure.
- **Transport:** `fetch` and `headers` options, with `globalThis.fetch` by
  default. 1.x's Axios instance and its `axios` options are gone, and an
  `axios` option is ignored: set headers in `headers`.
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
