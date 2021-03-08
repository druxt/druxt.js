---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtJS Entity module provides a Drupal Display Mode powered Entity and Field component system for your Nuxt.js application.


## The DruxtEntity component

Druxt Entity provides a Vue.js component to render a Drupal Entity.

```vue
<DruxtEntity :type="resourceType" :uuid="uuid" mode="displayMode" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtEntity.html).


### Druxt component

The DruxtEntity component is compatible with the DruxtJS component theming system:

```vue
<Druxt module="entity" :props-data="{ type, uuid, mode }" :wrapper="wrapper">
```

See the [Druxt component documentation](https://druxtjs.org/guide/#the-druxt-component) for more information.


## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

Find out more at [https://druxtjs.org](https://druxtjs.org)
