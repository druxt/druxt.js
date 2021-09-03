---
title: Entity
description: Drupal Display Mode powered Entity, Form and Field Druxt components.
---

![Example DruxtEntity component](/images/druxt-entity.png)

## Features

- Vue.js components:
  - **DruxtEntity**: Render a Drupal Content Entity by UUID
  - **DruxtEntityForm**: Render a Drupal Content Entity form
- **Druxt settings**: Filter JSON:API fields
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

### Reducing Entity data

The default behaviour of the Entity module is to retrieve all available fields from the JSON:API.

This behaviour is configurable using the modules `query` option, allowing for both manually filtered `fields`, automatically filtered fields using the Display mode `schema`, and a combination of the two as required.

The default behaviour can be set via `nuxt.config.js`:
```js
druxt: {
  entity: {
    query: {
      fields: ['path', 'title'],
      schema: true,
    },
  },
}
```

Alternatively, the behaviour can be set directly on an Entity Wrapper component:
```vue
<script>
export default {
  druxt: {
    query: {
      fields: ['title'],
      schema: false,
    }
  }
}
</script>
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
