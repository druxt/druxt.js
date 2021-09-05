---
title: JSON:API Client
weight: 5
---

# DruxtClient

The DruxtClient is the communication layer between Nuxt and the Drupal JSON:API.

It provides methods to get JSON:API Resources and Collection of resources from the Drupal server using the [Axios](https://www.npmjs.com/package/axios) library.

## Setup

The Client requires the `baseUrl` for your Drupal backend:

```js
const { DruxtClient } = require('druxt')
const druxt = new DruxtClient('https://demo-api.druxtjs.org')
```

It also provides an options object to configure the client:

```js
const druxt = new DruxtClient('https://demo-api.druxtjs.org', {
  axios: {
    headers: {'X-Custom-Header': true},
  },
  endpoint: 'jsonapi'
})
```

See the [API documentation](/api/client) for more details.

## Getting a resource

The `getResource` method requires the resource `type` and `id`, and has an optional `query` parameter.

_Get a page._
```js
druxt.getResource('node--page', 'd8dfd355-7f2f-4fc3-a149-288e4e293bdd').then(resource => {
  // Do the thing.
})
```

_Get a page's title._
```js
druxt.getResource(
  'node--page',
  'd8dfd355-7f2f-4fc3-a149-288e4e293bdd',
  'fields[node--page]=title'
).then(resource => {
  // Do the thing.
})
```

## Getting a collection of resources

The `getCollection` method requires the resource type, and has an optional `query` parameter.

_Get a collection of recipes._
```js
druxt.getCollection('node--recipe').then(collection => {
  // Do the thing.
})
```

_Get the first 5 recipes._
```js
druxt.getCollection('node--recipe', 'page[limit]=5').then(collection => {
  // Do the thing.
})
```

## Getting all collections of a resource

The `getCollectionAll` takes the same parameters as the `getCollection` method, and will return an array of all collections.

_Get all recipes._
```js
druxt.getCollectionAll('node--recipe').then(collections => {
  for (i in collections) {
    const collection = collections[i]
    for (j in collection.data) {
      const resource = collection.data[j]
      // Do the thing.
    }
  }
})
```
