# Introduction

DruxtJS provides an easy connection to your Drupal JSON:API backend in your Nuxt.js frontend application.


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

Get started with the [Guide](/guide/client) and [API Documentation](/api/client).

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

## The Druxt component

Druxt provides a Vue.js component to easily access Drupal's JSON:API data, with a simple Slot based theming system.

```vue
<Druxt
  :module="module"
  :props-data="propsData"
  :wrapper="wrapper"
/>
```


### Modules

Druxt has a growing list of modules, providing access to different Drupal powered functionality.

A module can be invoked either by setting the `module` and `props-data` properties of the `<Druxt />` component, or by using the module's component directly.

_**Example:** Using the [DruxtEntity module](https://entity.druxtjs.org) to render a 'node--article' resource._

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


### Wrapper theme system

Druxt modules use a slot-based Wrapper component system and a `wrapper` property to allow for simple, targetted theming of the Drupal data.


#### Wrapper property

The `wrapper` property controls the element that wraps the Druxt module component.

_**Example:** Render an Entity inside a `b-col` component._

```vue
<Druxt
  module="entity"
  :props-data="propsData"
  :wrapper="{ component: 'b-col' }"
/>
```

The `wrapper` property defaults to a `div` element if not provided.


#### Wrapper component system

The Wrapper component system uses data provided to the Druxt module to determine a list of possible component names.

The first option that matches a registered Vue.js component will be used to render the modules scoped slots.

Component options can be seen on the `component.options` property of the Druxt module component.

If there are no matching component names, a default `DruxtWrapper` component will be used instead.

See the [DruxtModule API documentation](/api/components/DruxtModule).

_**Example:** Theming an Article Entity._

```vue
<Druxt
  module="entity"
  :props-data="{ type: 'node--article', uuid }"
/>
```

_**Wrapper component:** components/druxt/entity/node/article/Default.vue_
```vue
<template>
  <div>
    <h1>{{ $attrs.entity.attributes.title }}</h1>

    <slot />
  </div>
</template>
```
