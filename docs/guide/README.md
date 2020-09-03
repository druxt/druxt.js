---
title: Introduction
---

# Druxt.js Breadcrumb

The Druxt.js Breadcrumb module adds a [Drupal](https://drupal.org) Breadcrumbs Vue.js components to your [Nuxt.js](https://nuxtjs.org) frontend.


## How it works?

Upon installation the module installs a Nuxt.js plugin that registers the provided Vue.js components.


### Breadcrumb component

The Breadcrumb component uses the [Druxt.js Router](https://router.druxtjs.org) data to calculate the current breadcrumbs and passes them through to the configured render component.

See the [DruxtBreadcrumb component API documentation](../api/components/DruxtBreadcrumb).


**Example**

```vue
<druxt-breadcrumb />
```
