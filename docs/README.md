---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtJS Blocks module adds [Drupal](https://drupal.org) Blocks, Content Blocks and Block Region Vue.js components to your [Nuxt.js](https://nuxtjs.org) frontend.


## The DruxtBlock component

Druxt Blocks provides a Vue.js component to render a specified Block.

```vue
<DruxtBlock :uuid="name" :mode="displayMode" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtBlock.html).



## The DruxtBlockRegion component

Druxt Blocks provides a Vue.js component to render all Blocks in a specified Drupal Region, for a specified theme.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtBlockRegion.html).


### Druxt component

The DruxtBlock and DruxtBlockRegion components are compatible with the DruxtJS component theming system:

```vue
<Druxt module="block" :props-data="{ uuid, mode }" :wrapper="wrapper" />
```
```vue
<Druxt module="block-region" :props-data="{ name, theme }" :wrapper="wrapper" />
```

See the [Druxt component documentation](https://druxtjs.org/guide/#the-druxt-component) for more information.


## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) frontend.

Find out more at [http://druxtjs.org](http://druxtjs.org)
