# @druxt/client

The Druxt JSON:API client for Drupal. It reads, creates and updates resources, and signs in through Drupal's Simple OAuth module. It has no Vue or Nuxt dependency, so it runs in Node, a browser or any framework that has the Fetch API.

## Install

```sh
npm i @druxt/client
```

It needs Node `^22.19.0`, `^24.11.0` or `>=26.0.0`.

## Quick start

```js
import { DruxtClient } from '@druxt/client';

const druxt = new DruxtClient('https://demo-api.druxtjs.org');
const recipes = await druxt.getCollection('node--recipe', { 'page[limit]': 3 });

for (const recipe of recipes.data) {
  console.log(recipe.attributes.title);
}
```

`getCollection()` returns the JSON:API document, so the resources are in `recipes.data`.

## Methods

Create a client with `new DruxtClient(baseUrl, options)`. The base URL is required.

| Method                                                     | What it does                                                    | Returns                                  |
| ---------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `getResource(type, id, query?, prefix?, options?)`         | Reads one resource.                                             | The JSON:API document                    |
| `getCollection(type, query?, prefix?, options?)`           | Reads one page of a collection.                                 | The JSON:API document                    |
| `getCollectionAll(type, query?, prefix?, options?)`        | Reads every page of a collection.                               | An array of documents, one for each page |
| `getRelated(type, id, related, query?, prefix?, options?)` | Reads the resources of one relationship.                        | The JSON:API document                    |
| `getIndex(type?, prefix?)`                                 | Reads the JSON:API index, or one resource type's entry.         | The index, the entry, or `undefined`     |
| `createResource(resource, prefix?)`                        | Creates a resource. A resource with an `id` is updated.         | The HTTP response                        |
| `updateResource(resource, prefix?)`                        | Updates a resource.                                             | The HTTP response                        |
| `get(url, options?)`                                       | Sends a GET request. It uses the process cache when that is on. | The HTTP response                        |
| `request(url, options?)`                                   | Sends any request, as the signed-in user when there is one.     | The HTTP response                        |
| `buildQueryUrl(url, query?)`                               | Adds a query to a URL.                                          | The URL                                  |
| `url(path)`                                                | Joins a path to the Drupal base URL.                            | The absolute URL                         |
| `urlPrefix(prefix?)`                                       | Gets the URL prefix for a langcode, from the `prefixes` option. | The prefix                               |
| `addHeaders(headers)`                                      | Adds headers to every request.                                  | Nothing                                  |
| `onRequest(listener)`                                      | Listens to the start and end of each request.                   | A function that stops listening          |
| `clearCache()`                                             | Empties the index and the process cache.                        | Nothing                                  |
| `cacheLifetime(document)`                                  | Tells how long a fetched document may still be cached.          | Seconds, or `0`                          |
| `checkPermissions(response)`                               | Throws when Drupal omitted resources for lack of permissions.   | Nothing                                  |
| `error(error, context?)`                                   | Throws a formatted error for a failed request.                  | Never returns                            |

The arguments mean the same in every method:

- `type` is a JSON:API resource type, such as `node--recipe`.
- `query` is a query string, a plain object, or an object with `getQueryString()`, such as [drupal-jsonapi-params](https://www.npmjs.com/package/drupal-jsonapi-params).
- `prefix` is the URL prefix of a language, such as `es`. With the `prefixes` option, it can be a langcode.
- `options` on a read method is `{ bypassCache: true }`. The read then goes to Drupal even when the process cache holds the answer.

The HTTP response is `{ data, status, statusText, headers, url }`. Its `data` is the JSON:API document, or the body's text when the body is not JSON.

A method throws a `TypeError` when a required argument, such as `type` or `id`, is empty.

## Options

| Option                  | Type                                           | Default                                            | Description                                                           |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| `baseUrl`               | `string`                                       | The constructor's argument                         | The Drupal base URL. It wins over the argument.                       |
| `endpoint`              | `string`                                       | `/jsonapi`                                         | The JSON:API endpoint's path. `api`, `/api` and `/api/` are the same. |
| `headers`               | `Record<string, string>`                       | None                                               | Headers sent with every request.                                      |
| `fetch`                 | `(input, init?) => Promise<Response>`          | `globalThis.fetch`                                 | The fetch function requests are sent with.                            |
| `auth`                  | `DruxtAuthOptions`                             | Off                                                | Simple OAuth sign-in. A `clientId` turns it on. See [Auth](#auth).    |
| `cache`                 | `ProcessCacheOptions \| false`                 | Off                                                | The server-side cache. See [Process cache](#process-cache).           |
| `prefixes`              | `Record<string, string>`                       | None                                               | The URL prefix of each langcode, such as `{ en: '', es: 'spanish' }`. |
| `proxy`                 | `{ api?: boolean, files?: boolean \| string }` | None                                               | With `api`, a path is joined to the page's origin, not to `baseUrl`.  |
| `onRequest`             | `(event) => void`                              | None                                               | Called as each request starts and ends.                               |
| `warnOmitted`           | `boolean`                                      | `false`                                            | Warns when Drupal omits resources. See [Errors](#errors).             |
| `logger`                | `{ info, warn }`                               | `console`                                          | Where debug and warning messages go. It takes consola.                |
| `debug`                 | `boolean`                                      | `false`                                            | Logs each request's URL.                                              |
| `jsonapiResourceConfig` | `string`                                       | `jsonapi_resource_config--jsonapi_resource_config` | The resource type of JSON:API Extras' resource config.                |

Notes on the options:

- The client's `Authorization`, `Proxy-Authorization` and `Cookie` headers are sent only to Drupal's origin, as the access token is. A header passed to one request, in its own options, is sent as given.
- An `onRequest` listener gets each request's method and URL when it starts, and its status and duration when it ends. It never gets headers or a body. The URL has no user name or password, and the values of the `token`, `access_token`, `code`, `password` and `client_secret` query keys are emptied.
- The Axios instance of 1.x is gone. An `axios` option is ignored, so set headers in `headers`.

## JSON:API index

The client reads Drupal's JSON:API index to find the URL of each resource type.

- The index is fetched once for each prefix. Concurrent calls share one fetch.
- Each link is used as a path under `baseUrl`, whatever host Drupal reports. No request goes to an internal host that Drupal reports from behind a proxy.
- A type the index does not list is read from its conventional URL, such as `/jsonapi/node/recipe`.
- When JSON:API Extras' resource config can be read, each entry also has its `resourceType`, `entityType`, `bundle` and `resourceFields`. When it cannot be read, the client logs a warning and uses the index as it is.

`getIndex()` returns the whole index. `getIndex('node--recipe')` returns that type's entry, or `undefined` when the index has none.

## Process cache

The process cache keeps responses on a server between requests. It is off unless the `cache` option is set, and it is never used in a browser. `clearCache()` empties it.

| Option                | Type      | Default           | Description                                                              |
| --------------------- | --------- | ----------------- | ------------------------------------------------------------------------ |
| `cache.content`       | `boolean` | `false`           | Also keeps the responses to `get()`. Without it, only the index is kept. |
| `cache.ttl`           | `number`  | None              | The most seconds an entry may live. It never extends `Cache-Control`.    |
| `cache.maxSize`       | `number`  | 50 MB             | The bytes of stored JSON each cache area keeps.                          |
| `cache.sessionCookie` | `string`  | `S?SESS[0-9a-f]+` | A pattern for the name of the session cookie.                            |

- Only a response to a request without credentials is kept. A client that sends an `Authorization` header, a session cookie or an `Origin` header, or that is signed in, does not use the cache.
- A response is kept for as long as its `Cache-Control` lets a shared cache keep it.
- With `cache.content`, a `get()` is kept when Drupal answers with a 200 whose body is a JSON object or array. A request with its own headers or body is not kept, because they could change the response.
- A read with `bypassCache` goes to Drupal. Its answer replaces the entry when it may be kept. Any other answer removes the entry, as a 404 does. A request that never reaches Drupal leaves the entry.
- A cache area holds one kind of answer, such as the content or a module's menus. Each set of client headers keeps its own entries in it, for up to 32 sets. Past `cache.maxSize`, the area's least recently used entries go first.

## Auth

With `auth: { clientId }`, the client signs in through Drupal's [Simple OAuth](https://www.drupal.org/project/simple_oauth) module. The auth methods are on `druxt.auth`.

| Method                                                                             | Grant                              |
| ---------------------------------------------------------------------------------- | ---------------------------------- |
| `authorize({ redirectUri })`, then `exchangeCode({ code, verifier, redirectUri })` | Authorization code, with PKCE      |
| `loginWithPassword({ username, password })`                                        | Password                           |
| `loginWithClientCredentials({ scope })`                                            | Client credentials                 |
| `refresh()`                                                                        | Refresh token                      |
| `getUser()`                                                                        | None. It reads the signed-in user. |
| `logout()`                                                                         | None. It ends the session.         |

`request()` sends each request as the signed-in user, and keeps the session alive:

- An expired token is refreshed before the request is sent.
- A 401 from Drupal's origin is refreshed, and the request is sent again once. A 401 from another host is returned as it is.
- When Drupal refuses the refresh token, the session ends and a read is repeated as the anonymous visitor. A write is never repeated, and one that was waiting on the refresh is not sent.
- With no refresh token, a 401 to a read ends the session and the read is repeated as the anonymous visitor. A 401 to a write does neither.
- A refresh that fails any other way, such as a timeout, keeps the session, and the 401 is returned.
- A stream body is never sent twice. A 401 to it still refreshes the session, and the caller sends a new stream.

A sign-in ends the session held as it starts, so the client is signed out after a sign-in that fails. A later sign-in, or a sign-out, replaces a sign-in or a refresh that is still running. The replaced one stores nothing, and rejects with an error that `isSuperseded(error)` tells from a failure. A request that waits on a refresh while another session signs in rejects the same way, and is not sent.

With `auth.session`, the site's server holds the tokens in httpOnly cookies and the client holds none. `logout()` then calls the site's `auth.logoutUrl` route first, when one is set. When that route fails, `logout()` rejects and the session is kept.

## Errors

- `get()` and the resource methods throw a formatted error when a request fails. Its message has the status, the URL and the detail of Drupal's first JSON:API error. The response is on `error.response`.
- `request()` throws for any status but a 2xx. Pass `validateStatus` in its options to choose which statuses throw.
- `checkPermissions(response)` throws a `DruxtPermissionsError` when Drupal omitted resources for lack of permissions. Its `permissions` lists the permissions Drupal named.
- `isSuperseded(error)` tells an error for a replaced session from a failure. See [Auth](#auth).

Drupal can omit resources from a response without an error, as it does for lack of permission:

- `omittedResources(document)` returns Drupal's reason, and the type and id of each omitted resource.
- An `onRequest` listener's `end` event has Drupal's reason as `omitted`.
- With the `warnOmitted` option, the client logs a warning with the code `DRUXT_E01001`. The warning names each omitted type and quotes the reason. Each type is warned about once for each site, until `clearCache()`. Druxt's Nuxt module turns it on in development.
