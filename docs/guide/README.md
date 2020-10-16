---
title: Introduction
---

# DruxtJS Blocks

The DruxtJS Blocks module adds [Drupal](https://drupal.org) Blocks, Content Blocks and Block Region Vue.js components to your [NuxtJS](https://nuxtjs.org) frontend.


## How it works?

Upon installation the module installs a NuxtJS plugin that registers the provided Vue.js components.


### Block Region component

The Block Region component renders all Drupal blocks in a specified region, with support for Drupal's visibility settings.

See the [DruxtBlockRegion component API documentation](../api/components/DruxtBlockRegion).


**Example**

_Header region blocks for Umami theme._

```vue live
<DruxtBlockRegion
  name="header"
  theme="umami"
/>
```


### Block component

The Block component renders a single Drupal Block using the DruxtJS Router and Component suggestion system.

See the [DruxtBlock component API documentation](../api/components/DruxtBlock).


**Example**

_Block Content block rendered by UUID._

```vue live
<DruxtBlock
  uuid="baefa4d3-9517-4413-8b9e-975c8affb8ac"
/>
```
