---
title: Introduction
---

# DruxtJS

DruxtJS provides an easy connection to your Drupal JSON:API backend in your Nuxt.js frontend application.


## Features

- [Nuxt module](#nuxt-module)
- [JSON:API Client](#drupal-json-api-client)
  - [DruxtClient](#druxtclient)
  - [DruxtStore](#druxtstore)
- [Druxt components](#druxt-components)
  - [Modules](#modules)
  - [Theming](#theming)


## Nuxt module

The Druxt module provides Vue.js components, a JSON:API Client, a Vuex store and a Nuxt module, among other things.

The Nuxt module installs all required components and dependencies, however most components can be used individually in any Node project.

```js
module.exports = {
  modules: ['druxt'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
}
```

See [Getting started](/guide/getting-started) and the [API documentation](/api) for more details.


## Drupal JSON:API client

Two methods of communication with the Drupal JSON:API are provided by Druxt, the **DruxtClient** and the **DruxtStore**.

### DruxtClient

The **DruxtClient** is a framework agnostic class, allowing access to Drupal's JSON:API resources and collections in your Node.js application.

**Example:** _Retrieve a collection of Page Node resources._
```js
const { DruxtClient } = require('druxt')
new DruxtClient('https://demo-api.druxtjs.org')
  .getCollection('node--page')
  .then((res) => {
    // Do the thing!
  })
```

Get started with the [Guide](/guide/client) and [API Documentation](/api/packages/druxt/client).

### DruxtStore

The **DruxtStore** is a Vuex module that provides the **DruxtClient** with a caching layer, only requesting data from Drupal where it's not already available in the store.

**Example:** _Retrieve a Page Node resources._
```vue
<script>
export default {
  async fetch() {
    this.resource = await this.$store.dispatch('druxt/getResource', {
      type: 'node--page',
      id: 'f09d8d5f-4998-4811-8fd1-05647f1c85d9'
    })
  },
  data: () => ({ resource: null })
}
</script>
```

The DruxtStore is installed via the Nuxt module, see [getting started](/guide/getting-started).

## Druxt components

Druxt provides a Vue.js component system for easy access Drupal's JSON:API data, with a simple Slot based theming system.

### Modules

Druxt has a growing list of modules, providing access to different Drupal powered functionality.

A module can be invoked either by setting the `module` and `props-data` properties of the `<Druxt />` component, or by using the module's component directly.

_**Example:** Using the [DruxtEntity module](/modules/entity) to render a 'node--article' resource._

```vue
<Druxt
  module="entity"
  :props-data="{
    mode: 'teaser',
    type: 'node--article',
    uuid
  }"
/>
```

```vue
<DruxtEntity mode="teaser" type="node--article" :uuid="uuid">
```

See the [Druxt module list](/modules) for more information.


### Theming

Druxt modules use a slot-based Wrapper component system to provide rich defaults while still allowing full control over all theming and functionality.

See the [theming guide](/guide/theming) for more details.
