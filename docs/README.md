---
home: true
heroImage: ./logo.svg
actionText: Get started
actionLink: /guide/getting-started
---

> The DruxtJS Blocks module adds [Drupal](https://drupal.org) Blocks, Content Blocks and Block Region Vue.js components to your [NuxtJS](https://nuxtjs.org) frontend.

**Example:** Header region for Umami theme.

```vue live
<DruxtBlockRegion
  name="header"
  theme="umami"
/>
```

**Example:** Block Content block rendered by UUID.

```vue live
<DruxtBlock
  uuid="baefa4d3-9517-4413-8b9e-975c8affb8ac"
/>
```

## DruxtJS

DruxtJS is a suite of modules to connect a [Drupal](https://drupal.org) JSON:API backend to a [NuxtJS](https://nuxtjs.org) frontend.

Find out more at [http://druxtjs.org](http://druxtjs.org)
