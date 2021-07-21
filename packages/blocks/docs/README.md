---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtBlocks module adds [Drupal](https://drupal.org) Blocks, Content Blocks and Block Region Vue.js components to your [Nuxt.js](https://nuxtjs.org) application.


### DruxtBlock

The DruxtBlock component renders a Drupal JSON:API Block resource by ID or UUID.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlock :uuid="uuid" />
```

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtBlock.html).



### DruxtBlockRegion

The DruxtBlockRegion component renders all visible blocks for the specified theme region.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

![Example DruxtBlockRegion component](./images/druxt-block-region.png)

Get started with the [Guide](guide/) and [API Documentation](/api/components/DruxtBlockRegion.html).


## DruxtJS

DruxtJS is a framework to connect a [Drupal](https://drupal.org) JSON:API backend to a [Nuxt.js](https://nuxtjs.org) application.

Find out more at [https://druxtjs.org](https://druxtjs.org)