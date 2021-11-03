---
title: Entity
description: Drupal Display Mode powered Entity, Form and Field Druxt components.
---

![Example DruxtEntity component](/images/druxt-entity.png)

## Features

- Vue.js components:
  - **DruxtEntity**: Render a Drupal Content Entity by UUID
  - **DruxtEntityForm**: Render a Drupal Content Entity form
- **Druxt settings**: Include and filter resource fields
- **Druxt Router** integration
- **@nuxtjs/Storybook** integration

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-entity
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-entity'],
   }
   ```

* * *

## Vue.js Components

### DruxtEntity

Renders a Drupal Content Entity by JSON:API resource type, UUID, view mode and schema type.

Fields are rendered as [DruxtField](/api/packages/entity/components/DruxtField) components, based on the Drupal display mode configuration.

```vue
<DruxtEntity
  :type="resourceType"
  :uuid="uuid"
  :mode="displayMode"
/>
```

- For more details, refer to the [DruxtEntity component API documentation](/api/packages/entity/components/DruxtEntity).

### DruxtEntityForm

Renders a Drupal Content Entity form with submission and validation support.

```vue
<DruxtEntityForm
  :type="resourceType"
  :mode="displayMode"
  @error="onError"
  @submit="onSubmit"
  v-model="entity"
/>
```

![Example DruxtEntityForm component](/images/druxt-entity-form.png)

- For more details, refer to the [DruxtEntityForm component API documentation](/api/packages/entity/components/DruxtEntityForm).

* * *

## Settings

### Entity queries

Entity queries settings can be provided to include related resources and filter the returned fields.

- **fields**: An array of strings, or array of arrays formatted for the Drupal JSON:API Params addFields method, used to filter the returned resources fields.
- **include**: An array of relationship id's to include in the returned resources.
- **schema**: Boolean, if `true` fields will be populated by the Drupal Display schema information.

_Example: Wrapper component with Query settings:_
```vue
<script>
export default {
  druxt: {
    query: {
      fields: ['title', 'path'],
      schema: true,
    }
  }
}
</script>
```

_Example: DruxtEntity with settings property:_

```vue
<template>
  <DruxtEntity
    :settings="{
      query: {
        include: ['field_media_image', 'field_media_image.field_media_image'],
        fields: [
          ['file--file', ['uri']],
          ['media--image', []],
        ]
      }
    }"
    type="node--recipe"
    :uuid="uuid"
  />
</template>
```

The default behaviour can be set via `nuxt.config.js`:
```js
druxt: {
  entity: {
    query: {
      fields: ['path', 'title'], // Apply filter to all Entity queries.
      schema: true, // Filter by display mode field settings.
    },
  },
}
```

* * *

## Router support

The DruxtEntity module provides a **DruxtRouterEntity** component that is used by the Druxt Router module to render a Content Entity route.

- For more details, see the [Druxt Router module](/modules/router).

* * *

## Storybook

DruxtEntity provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

- For more details, see the [Storybook guide](/guide/storybook).

* * *
