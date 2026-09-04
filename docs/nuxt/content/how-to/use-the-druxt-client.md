---
title: Use the Druxt client directly
weight: -3
description: Fetch resources and collections with DruxtClient, with or without Nuxt.
---

> **Before you start:** this guide assumes a Drupal backend with Druxt
> enabled (see [Getting started](/tutorials/getting-started)) and a reason
> to bypass the component layer: custom fetching, scripting, or non-Nuxt
> usage.

The DruxtClient is the communication layer between the frontend and the
Drupal JSON:API. It provides methods to get JSON:API resources and
collections of resources from the Drupal server using the
[Axios](https://www.npmjs.com/package/axios) library.

It is plain JavaScript with no Vue or Nuxt requirement. Inside a Druxt
site it is already there as `this.$druxt`; in any other Node process,
install it and instantiate it yourself:

```sh
npm install druxt
```

## Setup

The Client requires the `baseUrl` for your Drupal backend:

```js
import { DruxtClient } from 'druxt'
const druxt = new DruxtClient('https://demo-api.druxtjs.org')
// (In CommonJS: const { DruxtClient } = require('druxt'))
```

The UUIDs in the examples below are illustrative: the demo backend is
reinstalled on every rollout, so its IDs change. List
`https://demo-api.druxtjs.org/jsonapi/node/page` and take an `id` from
the response before running them. Query a resource's fields rather than
assuming names; Umami's body field, for one, is `field_body`, not
`body`.

It also provides an options object to configure the client:

```js
const druxt = new DruxtClient('https://demo-api.druxtjs.org', {
  axios: {
    headers: { 'X-Custom-Header': true },
  },
  endpoint: 'jsonapi',
});
```

See the [API documentation](/api/packages/druxt/client) for more details.

## Getting a resource

The `getResource` method requires the resource `type` and `id`, and has an optional `query` and `prefix` parameter.

_Get a page._

```js
druxt.getResource('node--page', 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd').then((resource) => {
  // Do the thing.
});
```

_Get a page's title._

```js
druxt
  .getResource('node--page', 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd', 'fields[node--page]=title')
  .then((resource) => {
    // Do the thing.
  });
```

_Get a translated page._

```js
druxt
  .getResource('node--page', 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd', undefined, 'es')
  .then((resource) => {
    // Do the thing.
  });
```

## Getting a collection of resources

The `getCollection` method requires the resource type, and has an optional `query` and `prefix` parameter.

_Get a collection of recipes._

```js
druxt.getCollection('node--recipe').then((collection) => {
  // Do the thing.
});
```

_Get the first 5 recipes._

```js
druxt.getCollection('node--recipe', 'page[limit]=5').then((collection) => {
  // Do the thing.
});
```

_Get the first 5 recipes in Spanish._

```js
druxt.getCollection('node--recipe', 'page[limit]=5', 'es').then((collection) => {
  // Do the thing.
});
```

## Getting all collections of a resource

The `getCollectionAll` method takes the same parameters as `getCollection`, and will return an array of all collections.

_Get all recipes._

```js
druxt.getCollectionAll('node--recipe').then((collections) => {
  for (const collection of collections) {
    for (const resource of collection.data) {
      // Do the thing.
    }
  }
});
```

## Testing against fixtures

`DruxtClient` accepts an axios instance via `options.axios`, the same
injection point Nuxt's plugin uses. Handing it an axios adapter that
replays recorded JSON:API responses lets a test suite run with no
backend at all.

## A worked example

The monorepo's
[`examples/node-client`](https://github.com/druxt/druxt.js/tree/develop/examples/node-client)
directory shows the client and `druxt-schema` in a standalone Node
script (listing a backend's resource types, printing schemas, sampling
content), with a Jest suite running against recorded fixtures through
the axios injection point. It is an example of what you could build,
not part of the framework. The package is private to the repository and
not published to npm.

## Where to go next

- [The schema system](/explanation/schemas): what schemas are and where
  they come from.
- [DruxtClient API](/api/packages/druxt/client): every method.
