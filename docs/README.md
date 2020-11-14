---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtJS Views module adds [Drupal](https://drupal.org) Views support to your [NuxtJS](https://nuxtjs.org) application.


## The DruxtView component

Druxt Views provides a Vue.js component to render a Drupal View.

```vue
<DruxtView :display-id="displayId" :uuid="uuid" :view-id="viewId" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtView.html).


### Druxt component

The DruxtEntity component is compatible with the DruxtJS component theming system:

```vue
<Druxt module="view" :props-data="{ displayId, uuid, viewId }" :wrapper="wrapper">
```

See the [Druxt component documentation](https://druxtjs.org/guide/#the-druxt-component) for more information.


## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

Find out more at [http://druxtjs.org](http://druxtjs.org)
