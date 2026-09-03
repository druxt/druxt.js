---
weight: 0
title: Use Druxt in a Node application
description: DruxtClient and DruxtSchema are plain JavaScript. Use them from any Node process, with no Vue or Nuxt in between.
---

> **Before you start:** this guide assumes a Drupal backend with Druxt
> enabled (see [Getting started](/tutorials/getting-started)).

Everything below Nuxt in the stack, `DruxtClient`, `DruxtSchema` and the
store modules, is plain JavaScript with no Vue or Nuxt requirement. Any
Node process can install and use it:

```sh
npm install druxt
```

## Using the client

```js
const { DruxtClient } = require('druxt');

const druxt = new DruxtClient('http://127.0.0.1:8888');

// The JSON:API index.
const index = await druxt.getIndex();

// A collection, one page.
const collection = await druxt.getCollection('node--recipe');

// A single resource by UUID, with JSON:API query filtering.
const recipe = await druxt.getResource('node--recipe', uuid, {
  'fields[node--recipe]': 'title,field_ingredients',
});

// Every page of a collection.
const collections = await druxt.getCollectionAll('node--recipe');
```

The method surface is the same one Nuxt injects as `this.$druxt`, so
anything the [client how-to](/how-to/use-the-druxt-client) shows in a
component works verbatim in a script. The
[DruxtClient API reference](/api/packages/druxt/client) has the full
method list.

Schemas work the same way: `druxt-schema` exports the class that turns a
display mode into the field schema `druxt-entity` renders from, and it
runs anywhere the client does.

## Testing against fixtures

`DruxtClient` accepts an axios instance via `options.axios`, the same
injection point Nuxt's plugin uses. Handing it an axios adapter that
replays recorded JSON:API responses lets a test suite run with no
backend at all.

## A worked example

The monorepo's
[`examples/node-client`](https://github.com/druxt/druxt.js/tree/develop/examples/node-client)
directory shows all of this in one place: a small inspection script
built on `DruxtClient` and `DruxtSchema` (listing a backend's resource
types, printing schemas, sampling content), with a Jest suite that runs
against recorded fixtures through the axios injection point.

It is an example of what you could build, not part of the framework.
The package is private to the repository and not published to npm. Run
it from a checkout if you want to poke at it.

## Where to go next

- [Use the Druxt client directly](/how-to/use-the-druxt-client): the
  same client inside a Nuxt site.
- [The schema system](/explanation/schemas): what those schemas are and
  where they come from.
- [DruxtClient API](/api/packages/druxt/client): every method.
