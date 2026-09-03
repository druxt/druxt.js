---
title: Use the Druxt client directly
weight: -1
description: Fetch resources and collections with DruxtClient, with or without Nuxt.
---

> **Before you start:** this guide assumes a working Druxt site (see
> [Getting started](/tutorials/getting-started)) and a reason to bypass the
> component layer: custom fetching, scripting, or non-Nuxt usage.

The DruxtClient is the communication layer between Nuxt and the Drupal JSON:API.

It provides methods to get JSON:API resources and collections of resources from the Drupal server using the [Axios](https://www.npmjs.com/package/axios) library.

## Setup

The Client requires the `baseUrl` for your Drupal backend:

```js
const { DruxtClient } = require('druxt');
const druxt = new DruxtClient('https://demo-api.druxtjs.org');
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
