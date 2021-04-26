---
title: Introduction
---

# DruxtJS Views

The DruxtViews module adds Drupal Views support to your [Nuxt.js](https://nuxtjs.org) frontend.


## Features

- Nuxt module
- DruxtView component
- DruxtRouter support
- DruxtBlock support
- Druxt Module wrapper theming support
- Druxt Module settings
- Scoped slots
- Auto-generated Nuxt Storybook integration


## Nuxt module

The DruxtView module provides Vue.js components, a Vuex store and a Nuxt module, among other things.

The Nuxt module installs all required components and dependencies, however most components can be used individually in any Node project.

```js
module.exports = {
  modules: ['druxt-views'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
}
```

See [Getting started](/guide/getting-started) and the [API documentation](/api) for more details.


## DruxtView component

The `DruxtView` component fetches the View and View result JSON:API resources and renders the output using the [DruxtJS Entity](https://entity.druxtjs.org) component.

```vue
<DruxtView :displayId="displayId" :uuid="uuid" :viewId="viewId" />
```

See the [DruxtView component API documentation](../api/components/DruxtView.html).


## Module wrapper theming

All DruxtView module components support the DruxtModule/Wrapper theming system.

Ir provides scoped slots as well as $attrs/props for slotless wrappers.

_**Example:** DruxtEntityView**ViewId**.vue_
```vue
<template>
  <div v-if="slot">
    <slot />
  </div>

  <div v-else-if="slots">
    <slot name="header" />
    <slot name="results" />
    <slot name="pager" />
  </div>

  <div v-else>
    <DruxtEntity v-for="result of $attrs.results" :key="result.id" v-bind="props(result)" />
  </div>
</template>

<script>
export default {
  druxt: {
    ...
    query: {
      bundleFilter: true,
      fields: ['title'],
    }
  }
}
</script>
```

See the [Druxt Wrapper theming documentation](https://druxtjs.org/guide/#wrapper-theme-system) for more information.


## Router support

Adds Views Page support via the [DruxtRouter module](https://router.druxtjs.org) and the [Decoupled Router module](https://www.drupal.org/project/decoupled_router).


## Blocks support

Adds Views Blocks support via the [DruxtBlocks module](https://blocks.druxtjs.org) and the `<DruxtBlockRegion />` component

## Storybook

DruxtViews provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

See [Gettings started](/guide/getting-started) for more information.
