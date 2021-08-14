---
title: Introduction
---

# DruxtViews

The DruxtViews module adds Drupal Views support to your [Nuxt.js](https://nuxtjs.org) frontend.


## Features

- [Nuxt module](#nuxt-module)
- [DruxtView component](#druxtview-component)
- [DruxtRouter support](#router-support)
- [DruxtBlock support](#blocks-support)
- [DruxtWrapper theming system](#druxwrapper-themeing)
- [Auto-generated Nuxt Storybook integration](#storybook)


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

The `DruxtView` component fetches the View and View result JSON:API resources and renders the output using the [DruxtEntity](https://entity.druxtjs.org) component.

```vue
<DruxtView :displayId="displayId" :viewId="viewId" />
```

![Example DruxtView component](../images/druxt-views-page.png)

See the [DruxtView component API documentation](../api/components/DruxtView.html).


## DruxtWrapper theming

Druxt modules use a slot-based Wrapper component system to provide rich defaults while still allowing full control over all theming and functionality.

See the [theming guide](https://druxtjs.org/guide/theming.html) for more details.


## Router support

Adds Views Page support via the [DruxtRouter module](https://router.druxtjs.org) and the [Decoupled Router module](https://www.drupal.org/project/decoupled_router).


## Blocks support

Adds Views Blocks support via the [DruxtBlocks module](https://blocks.druxtjs.org) and the `<DruxtBlockRegion />` component

## Storybook

DruxtViews provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

See [Gettings started](/guide/getting-started) for more information.
