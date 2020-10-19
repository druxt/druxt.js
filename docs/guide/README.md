---
title: Introduction
---

# DruxtJS Views

The DruxtJS Views module adds [Drupal](https://drupal.org) Views support to your [Nuxt.js](https://nuxtjs.org) frontend.


## How it works?

Upon installation the module installs a Nuxt.js plugin that registers the provided Vue.js components.


### DruxtView component.

The `DruxtView` component fetches the View and View results JSON:API resources and renders the output using the [DruxtJS Entity](https://entity.druxtjs.org) component.

This component can be used directly by the [DruxtJS Router](https://router.druxtjs.org) to render View pages.

```vue
<DruxtView :displayId="displayId" :uuid="uuid" :viewId="viewId" />
```

See the [DruxtView component API documentation](../api/components/DruxtView.html).


### DruxtBlockViewsBlock component.

The `DruxtBlockViewsBlock` component adds Views blocks support to the [DruxtJS Blocks](https://blocks.druxtjs.org) component.

This component is intended to be rendered by the <DruxtBlock /> component.

See the [DruxtBlockViewsBlock component API documentation](../api/components/blocks/DruxtBlockViewsBlock.html).

**Example**

```vue
<DruxtBlock :uuid="uuid" />
```
