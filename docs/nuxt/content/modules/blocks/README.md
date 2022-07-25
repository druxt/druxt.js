---
title: Blocks
description: Drupal Block and Block Region Druxt components.
---

![Example DruxtBlockRegion component](/images/druxt-block-region.png)


## Features

- Vue.js components:
  - **DruxtBlock**: Render Drupal blocks by UUID or internal ID
  - **DruxtBlockRegion**: Render all blocks within a region
- **Druxt settings**: Filter JSON:API fields
- **@nuxtjs/Storybook** integration

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-blocks
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-blocks'],
   }
   ```

* * *

## Vue.js components

### DruxtBlock

Renders a Drupal Block by UUID or Drupal's internal ID.

```vue
<DruxtBlock :id="drupal_internal__id" />
```

```vue
<DruxtBlock :uuid="uuid" />
```

- For more details, refer to the [DruxtBlock API documentation](/api/packages/blocks/components/DruxtBlock).


### DruxtBlockRegion

Renders all visible blocks by theme and region name.

```vue
<DruxtBlockRegion :name="name" :theme="theme" />
```

![Example DruxtBlockRegion component](/images/druxt-block-region.png)

- For more details, refer to the [DruxtBlockRegion API documentation](/api/packages/blocks/components/DruxtBlockRegion).

* * *

## Settings

### Reducing Block data

The default behaviour of the Block module is to retrieve all available fields from the JSON:API.

This behaviour is configurable using the modules `query` option, allowing for manually filtered `fields`.

The default behaviour can be set via `nuxt.config.js`:
```js
druxt: {
  blocks: {
    query: {
      fields: ['dependencies'],
    },
  },
}
```

* * *

## Storybook

DruxtBlocks provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

![DruxtBlocks Storybook integration](/images/druxt-block-storybook.png)

- For more details, see the [Storybook guide](/guide/storybook).

* * *
