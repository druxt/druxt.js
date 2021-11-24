---
title: Router
description: Drupal router for Nuxt, powered by the Drupal Decoupled Router module.
---

## Features

- Vue.js components:
  - **DruxtRouter**: Renders a Druxt component for the resolved Decoupled route
- Route providers:
  - **Content entity** routes resolve **DruxtEntity** components
  - **Drupal Views** page routes resolve **DruxtView** components

* * *

## Installation

1. Download the module:
   ```sh
   npm i druxt-router
   ```

2. Add the module to `nuxt.config.js`:
   ```js
   export default {
     modules: ['druxt-router/nuxt'],
   }
   ```

### Options

- `druxt.router.middleware`

  Type: `boolean`  
  Default: `true`

  Controls whether to execute the Route page middleware and process redirects.

- `druxt.router.pages`

  Type: `boolean`  
  Default: `true` if **pages/** directory exists, else `false`

  Controls whether the Nuxt **pages/** directory is used to generate routes.

- `druxt.router.wildcard`

  Type: `boolean`  
  Default: `true`

  Controls whether the wildcard route should be installed into the Nuxt/Vue router.

* * *

##  Vue.js components

### DruxtRouter

Renders a Druxt module router component based on the resolved route provided by the Drupal Decoupled Router module.

```vue
<DruxtRouter path="/" />
```

If no Path is provided, the component will default to the Vue router fullpath.

- For more details, refer to the [DruxtBlock API documentation](/api/packages/router/components/DruxtRouter).

* * *
