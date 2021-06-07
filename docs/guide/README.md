---
title: Introduction
---

# DruxtBreadcrumb

The Druxt Breadcrumb module adds a [Drupal](https://drupal.org) Breadcrumbs Vue.js component to your [Nuxt.js](https://nuxtjs.org) frontend.


## Features

- [Nuxt module](#nuxt-module)
- [DruxtBreadcrumb component](#druxtbreadcrumb-component)
- [Slot and wrapper theming](#theming)


## Nuxt module

The DruxtBreadcrumb module provides Vue.js components and a Nuxt module, among other things.

The Nuxt module installs all required components and dependencie.

```js
module.exports = {
  modules: ['druxt-breadcrumb'],
  druxt: { baseUrl: 'https://demo-api.druxtjs.org' },
}
```

See [Getting started](/guide/getting-started) and the [API documentation](/api) for more details.


## DruxtBreadcrumb component

The DruxtBreadcrumb component uses the Vue Router and DruxtRouter to build a list of crumbs.

```vue
<DruxtBreadcrumb />
```

![Example DruxtBreadcrumb component](../images/druxt-breadcrumb.png)

See the [DruxtBreadcrumb component API documentation](/api/components/DruxtBreadcrumb).

## Theming

The crumbs can be themed by providing a default scoped slot:
```vue
<DruxtBreadcrumb>
  <template #default="{ crumbs }">
    {{ crumbs }}
  </template>
</DruxtBreadcrumb>
```

The DruxtBreadcrumb also provide a DruxtWrapper component for theming:
```vue
<!-- DruxtBreadcrumbDefault.vue -->
<template>
  <div>
    <slot />
  <div>
</template>
```

See the [Wrapper theme system](https://druxtjs.org/guide/#wrapper-theme-system) guide for more information.
