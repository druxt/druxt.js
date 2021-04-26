---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtViews module adds [Drupal](https://drupal.org) Views support to your [Nuxt.js](https://nuxtjs.org) application.


## The DruxtView component

Druxt Views provides a Vue.js component to render a Drupal View.

```vue
<DruxtView :display-id="displayId" :uuid="uuid" :view-id="viewId" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtView.html).


### Druxt module/wrapper

The DruxtView component is compatible with the DruxtJS component theming system.


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

See the [documentation](https://druxtjs.org/guide/#wrapper-theme-system) for more information.


## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

Find out more at [http://druxtjs.org](http://druxtjs.org)
