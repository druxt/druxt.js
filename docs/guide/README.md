---
title: Introduction
---

# DruxtJS Menu

The DruxtJS Menu module adds support for [Drupal](https://drupal.org) Menus to your [Nuxt.js](https://nuxtjs.org) frontend.


## How it works?

Upon installation the module installs a Nuxt.js plugin that registers the provided Vue.js components and Vuex store.


### DruxtMenu component.

The `DruxtMenu` component fetches the Menu item JSON:API resources and renders the output using the `DruxtMenuItem` component.

```vue
<DruxtMenu />
```

See the [DruxtMenu component API documentation](../api/components/DruxtMenu.html).


### DruxtMenuItem component.

The `DruxtMenuItem` component is used by the `DruxtMenu` component to render individual menu items as either a child or recursivelty as a parent item.

See the [DruxtMenuItem component API documentation](../api/components/DruxtMenuItem.html).
