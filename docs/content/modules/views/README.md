---
title: Views
description: Drupal Views components for Druxt with support for filters, pagination and sorting.
---

![Example DruxtView page component](/images/druxt-views-page.png)

## Features

- Vue.js components:
  - **DruxtView**: Render a Drupal View by display as DruxtEntity components
- **View page routing and Blocks** with Druxt module integrations
- **Druxt settings**: Filter JSON:API fields
- **@nuxtjs/Storybook** integration

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-views
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-views'],
   }
   ```

* * *

## Vue.js components

### DruxtView

Renders a Drupal View using DruxtEntity components, using data provided by the Drupal JSON:API Views module.

```vue
<DruxtView :display-id="displayId" :view-id="viewId" />
```

- For more details, refer to the [DruxtView API documentation](/api/packages/views/components/DruxtView).


* * *

## Settings

### Reducing Views data

The default behaviour of the Views module is to retrieve all available fields from the JSON:API, for all results.

This behaviour is configurable using the modules `query` option, allowing for manually filtered `fields`, as well as automatic filtering with the `bundleFilter` option.

The default behaviour can be set via `nuxt.config.js`:
```js
export default {
  druxt: {
    views: {
      query: {
        bundleFilter: true,
      },
    },
  }
}
```

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `query.bundleFilter` | `boolean` | No | `false` | Whether to automatically detect Resource types to filter, based on the View `bundle` filter. |
| `query.fields` | `string[]` | No | `[]` | An array of fields to filter from the JSON:API Views Resource types. |
| `query.resourceTypes` | `string[]` | No | `[]` | An array of Resource types to be used by the Fields filter. |

* * *

## Router support

The DruxtViews module provides a **DruxtRouterView** component that is used by the Druxt Router module to render View page routes.

- For more details, see the [Druxt Router module](/modules/router).

* * *

## Storybook

DruxtViews provides zero-config, auto generated Storybook integration with a live data connnection to your Druxt backend.

- For more details, see the [Storybook guide](/guide/storybook).

* * *

