# Introduction

DruxtJS provides an easy connection to your Drupal JSON:API backend in your Nuxt.js frontend application.


## DruxtClient

The DruxtClient is the communication layer between Nuxt and the Drupal JSON:API.

It provides methods for retrieving JSON:API resources and collections.

**Example:**
```js
const { DruxtClient } = require('druxt')

const druxt = new DruxtClient('https://demo-api.druxtjs.org')

druxt.getCollection('node--page').then((res) => {
  ...
})
```

Get started with the [Guide](/guide/client) and [API Documentation](/api/client).

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

A module can be invoked by setting the `module` property and and providing module properties to the `props-data` property.

_**Example:** Using the [DruxtJS Entity module](https://entity.druxtjs.org) to render a 'node--article' resource._

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


### Wrapper theme system

Druxt provides a Vue.js Slot and Wrapper based theming system using a `wrapper` property on the Druxt component and a `DruxtComponentMixin` powered component suggestion system on the Druxt modules.


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


#### DruxtComponentMixin component system

The `DruxtComponentMixin` uses propsData provided by the specified Druxt `module` to determine a list of possible component names.

The first option that matches a globally registered component will be used to render the modules scoped slots.

Component options can be seen on the `component.options` property of the Druxt module component.

If there are no matching component names, a default `DruxtWrapper` component will be used instead.

See the [DruxtComponentMixin API documentation](/api/mixins/component.html).

_**Example:** Theming an Article Entity._

```vue
<Druxt
  module="entity"
  :props-data="{ type: 'node--article', uuid }"
/>
```

```vue
<!-- DruxtEntityNodeArticle.vue -->
<template>
  <div>
    <h1>{{ $attrs.entity.attributes.title }}</h1>

    <slot />
  </div>
</template>
```
